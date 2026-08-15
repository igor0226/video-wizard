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
import { FfmpegAudioService } from "./ffmpeg-audio.service";
import { FfmpegDashService } from "./ffmpeg-dash.service";
import { PhraseDetectionService } from "./phrase-detection.service";
import {
	executeProcessingStep,
	getFailedStep,
	normalizeFailureMessage,
	skipProcessingStep,
} from "./processing-step-runner";
import { WhisperTranscriptionService } from "./transcription.service";

type ExtractAudioResult = { audioRelativePath: string };
type TranscriptResult = { transcriptRelativePath: string };
type PhrasesResult = { phrasesRelativePath: string };
type DashResult = { segmentCount: number };

type ProcessingResults = {
	audio: ExtractAudioResult;
	transcript: TranscriptResult;
	phrases: PhrasesResult;
	dash: DashResult;
};

type VideoLock = {
	handle: Awaited<ReturnType<typeof open>>;
	path: string;
};

type StepRunnerDeps = {
	processingHistory: ProcessingHistoryService;
	logger: PinoLogger;
};

@Injectable()
export class JobsService {
	constructor(
		@InjectPinoLogger(JobsService.name)
		private readonly logger: PinoLogger,
		private readonly ffmpegDashService: FfmpegDashService,
		private readonly ffmpegAudioService: FfmpegAudioService,
		private readonly transcriptionService: WhisperTranscriptionService,
		private readonly phraseDetectionService: PhraseDetectionService,
		private readonly videoRepository: VideoRepositoryService,
		private readonly blobStorage: BlobStorageService,
		private readonly processingHistory: ProcessingHistoryService,
	) {}

	private getStepRunnerDeps(): StepRunnerDeps {
		return {
			processingHistory: this.processingHistory,
			logger: this.logger,
		};
	}

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
		const phrases = await this.detectPhrasesIfNeeded(video, transcript);
		const dash = await this.encodeDashIfNeeded(video);
		return { audio, transcript, phrases, dash };
	}

	private async extractAudioIfNeeded(
		video: VideoRecord,
	): Promise<ExtractAudioResult> {
		const audioRelativePath = this.blobStorage.getAudioRelativePath(video.id);

		if (await this.blobStorage.fileExists(audioRelativePath)) {
			return skipProcessingStep({
				deps: this.getStepRunnerDeps(),
				videoId: video.id,
				step: "audio_extract",
				logMessage: "audio-extract-skip",
				result: { audioRelativePath },
			});
		}

		return executeProcessingStep({
			deps: this.getStepRunnerDeps(),
			videoId: video.id,
			step: "audio_extract",
			startLogMessage: "audio-extract-start",
			run: async () => {
				const result = await this.ffmpegAudioService.extractAudio(video);
				this.logger.info(
					{ videoId: video.id, audioPath: result.audioRelativePath },
					"audio-extract-success",
				);
				return result;
			},
		});
	}

	private async transcribeIfNeeded(
		video: VideoRecord,
		audio: ExtractAudioResult,
	): Promise<TranscriptResult> {
		const transcriptRelativePath = this.blobStorage.getTranscriptRelativePath(
			video.id,
		);

		if (await this.blobStorage.fileExists(transcriptRelativePath)) {
			return skipProcessingStep({
				deps: this.getStepRunnerDeps(),
				videoId: video.id,
				step: "transcribing",
				logMessage: "transcription-skip",
				result: { transcriptRelativePath },
			});
		}

		return executeProcessingStep({
			deps: this.getStepRunnerDeps(),
			videoId: video.id,
			step: "transcribing",
			startLogMessage: "transcription-start",
			run: async () => {
				const result = await this.transcriptionService.transcribe({
					video,
					audioResult: audio,
				});
				this.logger.info(
					{
						videoId: video.id,
						transcriptPath: result.transcriptRelativePath,
					},
					"transcription-complete",
				);
				return result;
			},
		});
	}

	private async detectPhrasesIfNeeded(
		video: VideoRecord,
		transcript: TranscriptResult,
	): Promise<PhrasesResult> {
		const phrasesRelativePath = this.blobStorage.getPhrasesRelativePath(
			video.id,
		);

		if (await this.blobStorage.fileExists(phrasesRelativePath)) {
			return skipProcessingStep({
				deps: this.getStepRunnerDeps(),
				videoId: video.id,
				step: "detecting_phrases",
				logMessage: "phrase-detection-skip",
				result: { phrasesRelativePath },
			});
		}

		return executeProcessingStep({
			deps: this.getStepRunnerDeps(),
			videoId: video.id,
			step: "detecting_phrases",
			startLogMessage: "phrase-detection-start",
			run: async () => {
				const result = await this.phraseDetectionService.detectPhrases({
					video,
					transcriptRelativePath: transcript.transcriptRelativePath,
				});
				this.logger.info(
					{
						videoId: video.id,
						phrasesPath: result.phrasesRelativePath,
					},
					"phrase-detection-complete",
				);
				return result;
			},
		});
	}

	private async encodeDashIfNeeded(video: VideoRecord): Promise<DashResult> {
		const manifestRelativePath = path.posix.join(
			video.dashRelativePath,
			video.manifestFileName,
		);

		if (await this.blobStorage.fileExists(manifestRelativePath)) {
			return skipProcessingStep({
				deps: this.getStepRunnerDeps(),
				videoId: video.id,
				step: "dash_encoding",
				logMessage: "transcode-skip",
				result: { segmentCount: video.segmentCount },
			});
		}

		return executeProcessingStep({
			deps: this.getStepRunnerDeps(),
			videoId: video.id,
			step: "dash_encoding",
			startLogMessage: "transcode-start",
			run: async () => {
				const result = await this.ffmpegDashService.generateDashAssets(video);
				this.logger.info(
					{ videoId: video.id, segments: result.segmentCount },
					"transcode-success",
				);
				return result;
			},
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
