import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import {
	BlobStorageService,
	ProcessingHistoryService,
	type VideoRecord,
	VideoRepositoryService,
} from "../storage";
import {
	getFailedStep,
	normalizeFailureMessage,
} from "./processing-step-runner";
import {
	ProcessingPipelineService,
	type ProcessingResults,
} from "./processing-pipeline.service";

type VideoLock = {
	handle: Awaited<ReturnType<typeof open>>;
	path: string;
};

@Injectable()
export class JobsService {
	constructor(
		@InjectPinoLogger(JobsService.name)
		private readonly logger: PinoLogger,
		private readonly processingPipelineService: ProcessingPipelineService,
		private readonly videoRepository: VideoRepositoryService,
		private readonly blobStorage: BlobStorageService,
		private readonly processingHistory: ProcessingHistoryService,
	) {}

	async processNextPendingVideo(): Promise<void> {
		const video = await this.pickNextVideo();
		if (!video) {
			return;
		}

		const lock = await this.tryAcquireLock(video.id);
		if (!lock) {
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
			await this.releaseLock(lock);
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

	private async tryAcquireLock(videoId: string): Promise<VideoLock | null> {
		const lockPath = this.blobStorage.resolveRelativePath(
			path.posix.join("locks", `${videoId}.lock`),
		);
		await mkdir(path.dirname(lockPath), { recursive: true });

		try {
			const handle = await open(lockPath, "wx");
			return { handle, path: lockPath };
		} catch (error) {
			const code = (error as { code?: string }).code;
			if (code === "EEXIST") {
				this.logger.info({ videoId, reason: "already-locked" }, "lock-skip");
				return null;
			}
			throw error;
		}
	}

	private async releaseLock(lock: VideoLock): Promise<void> {
		await lock.handle.close();
		await rm(lock.path, { force: true });
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
