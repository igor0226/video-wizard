import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import {
	BlobStorageService,
	ProcessingHistoryService,
	type ProcessingStep,
	type VideoRecord,
	VideoRepositoryService,
} from "../storage";
import { FfmpegAudioService } from "./ffmpeg-audio.service";
import { FfmpegDashService } from "./ffmpeg-dash.service";
import { WhisperTranscriptionService } from "./transcription.service";

type ExtractAudioResult = { audioRelativePath: string };
type TranscriptResult = { transcriptRelativePath: string };
type DashResult = { segmentCount: number };

type ProcessingResults = {
	audio: ExtractAudioResult;
	transcript: TranscriptResult;
	dash: DashResult;
};

type VideoLock = {
	handle: Awaited<ReturnType<typeof open>>;
	path: string;
};

class StepFailedError extends Error {
	constructor(
		readonly step: ProcessingStep,
		cause: unknown,
	) {
		super(normalizeFailureMessage(cause));
		this.name = "StepFailedError";
	}
}

function normalizeFailureMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message.slice(0, 400);
	}
	return "Unexpected processing error";
}

function getFailedStep(error: unknown): ProcessingStep {
	if (error instanceof StepFailedError) {
		return error.step;
	}
	return "audio_extract";
}

@Injectable()
export class JobsService {
	constructor(
		@InjectPinoLogger(JobsService.name)
		private readonly logger: PinoLogger,
		private readonly ffmpegDashService: FfmpegDashService,
		private readonly ffmpegAudioService: FfmpegAudioService,
		private readonly transcriptionService: WhisperTranscriptionService,
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
			const results = await this.runProcessingPipeline(video);
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

	private async runProcessingPipeline(
		video: VideoRecord,
	): Promise<ProcessingResults> {
		const audio = await this.extractAudioIfNeeded(video);
		const transcript = await this.transcribeIfNeeded(video, audio);
		const dash = await this.encodeDashIfNeeded(video);
		return { audio, transcript, dash };
	}

	private async extractAudioIfNeeded(
		video: VideoRecord,
	): Promise<ExtractAudioResult> {
		const audioRelativePath = this.blobStorage.getAudioRelativePath(video.id);

		if (await this.blobStorage.fileExists(audioRelativePath)) {
			return this.skipStep(video, "audio_extract", "audio-extract-skip", {
				audioRelativePath,
			});
		}

		return this.executeStep(
			video,
			"audio_extract",
			"audio-extract-start",
			async () => {
				const result = await this.ffmpegAudioService.extractAudio(video);
				this.logger.info(
					{ videoId: video.id, audioPath: result.audioRelativePath },
					"audio-extract-success",
				);
				return result;
			},
		);
	}

	private async transcribeIfNeeded(
		video: VideoRecord,
		audio: ExtractAudioResult,
	): Promise<TranscriptResult> {
		const transcriptRelativePath = this.blobStorage.getTranscriptRelativePath(
			video.id,
		);

		if (await this.blobStorage.fileExists(transcriptRelativePath)) {
			return this.skipStep(video, "transcribing", "transcription-skip", {
				transcriptRelativePath,
			});
		}

		return this.executeStep(
			video,
			"transcribing",
			"transcription-start",
			async () => {
				const result = await this.transcriptionService.transcribe(video, audio);
				this.logger.info(
					{
						videoId: video.id,
						transcriptPath: result.transcriptRelativePath,
					},
					"transcription-complete",
				);
				return result;
			},
		);
	}

	private async encodeDashIfNeeded(video: VideoRecord): Promise<DashResult> {
		const manifestRelativePath = path.posix.join(
			video.dashRelativePath,
			video.manifestFileName,
		);

		if (await this.blobStorage.fileExists(manifestRelativePath)) {
			return this.skipStep(video, "dash_encoding", "transcode-skip", {
				segmentCount: video.segmentCount,
			});
		}

		return this.executeStep(
			video,
			"dash_encoding",
			"transcode-start",
			async () => {
				const result = await this.ffmpegDashService.generateDashAssets(video);
				this.logger.info(
					{ videoId: video.id, segments: result.segmentCount },
					"transcode-success",
				);
				return result;
			},
		);
	}

	private async skipStep<T>(
		video: VideoRecord,
		step: ProcessingStep,
		logMessage: string,
		result: T,
	): Promise<T> {
		this.logger.info({ videoId: video.id }, logMessage);
		await this.processingHistory.recordStepComplete(
			video.id,
			step,
			"skipped (already present)",
		);
		return result;
	}

	private async executeStep<T>(
		video: VideoRecord,
		step: ProcessingStep,
		startLogMessage: string,
		run: () => Promise<T>,
	): Promise<T> {
		this.logger.info({ videoId: video.id }, startLogMessage);
		await this.processingHistory.recordStepStart(video.id, step);

		try {
			const result = await run();
			await this.processingHistory.recordStepComplete(video.id, step);
			return result;
		} catch (error) {
			throw new StepFailedError(step, error);
		}
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
		await this.processingHistory.recordFailure(video.id, step, failureReason);
		await this.videoRepository.updateVideo(video.id, {
			status: "failed",
			failureReason,
		});
		this.logger.info({ videoId: video.id, status: "failed" }, "done");
	}
}
