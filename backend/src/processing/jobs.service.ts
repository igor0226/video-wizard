import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import {
	ProcessingHistoryService,
	ProcessingLockService,
	type VideoRecord,
	VideoRepositoryService,
} from "../storage";
import {
	getFailedStep,
	normalizeFailureMessage,
} from "./utils/processing-errors";
import {
	ProcessingPipelineService,
	type ProcessingResults,
} from "./processing-pipeline.service";

@Injectable()
export class JobsService {
	constructor(
		@InjectPinoLogger(JobsService.name)
		private readonly logger: PinoLogger,
		private readonly processingPipelineService: ProcessingPipelineService,
		private readonly videoRepository: VideoRepositoryService,
		private readonly processingLockService: ProcessingLockService,
		private readonly processingHistory: ProcessingHistoryService,
	) {}

	async processNextPendingVideo(): Promise<void> {
		const video = await this.pickNextVideo();
		if (!video) {
			return;
		}

		const acquired = await this.processingLockService.tryAcquire(video.id);
		if (!acquired) {
			this.logger.info(
				{ videoId: video.id, reason: "already-locked" },
				"lock-skip",
			);
			return;
		}

		try {
			await this.beginProcessing(video);
			const results =
				await this.processingPipelineService.runProcessingPipeline(video);
			await this.finishVideoSuccessfully(video, results);
		} catch (error) {
			await this.finishVideoWithFailure(video, error);
		} finally {
			await this.processingLockService.release(video.id);
		}
	}

	private async pickNextVideo(): Promise<VideoRecord | null> {
		this.logger.info("scan-processable start");
		const videos = await this.videoRepository.listVideos();

		const pending = videos
			.filter((video) => video.status === "pending")
			.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
		const staleProcessing = videos
			.filter((video) => video.status === "processing")
			.sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));

		const video = pending[0] ?? staleProcessing[0] ?? null;
		if (!video) {
			this.logger.info("scan-processable result=none");
			return null;
		}

		this.logger.info(
			{ videoId: video.id, status: video.status, title: video.title },
			"scan-processable found",
		);
		return video;
	}

	private async beginProcessing(video: VideoRecord): Promise<void> {
		if (video.status === "processing") {
			this.logger.info({ videoId: video.id }, "resume-processing");
			return;
		}

		this.logger.info({ videoId: video.id }, "mark-processing");
		await this.videoRepository.updateVideo(video.id, {
			status: "processing",
			failureReason: null,
		});
	}

	private async finishVideoSuccessfully(
		video: VideoRecord,
		results: ProcessingResults,
	): Promise<void> {
		await this.processingHistory.markCompleted(video.id);
		this.logger.info({ videoId: video.id }, "mark-ready");
		await this.videoRepository.updateVideo(video.id, {
			status: "ready",
			segmentCount: results.dash.segmentCount,
			transcriptRelativePath: results.transcript.transcriptRelativePath,
			phrasesRelativePath: results.phrases.phrasesRelativePath,
			failureReason: null,
		});
		this.logger.info({ videoId: video.id, status: "ready" }, "done");
	}

	private async finishVideoWithFailure(
		video: VideoRecord,
		error: unknown,
	): Promise<void> {
		const step = getFailedStep(error);
		const failureReason = normalizeFailureMessage(error);
		this.logger.error(
			{ videoId: video.id, step, reason: failureReason },
			"processing-failed",
		);
		await this.processingHistory.recordFailure({
			videoId: video.id,
			step,
			message: failureReason,
		});
		await this.videoRepository.updateVideo(video.id, {
			status: "failed",
			failureReason,
		});
		this.logger.info({ videoId: video.id, status: "failed" }, "done");
	}
}
