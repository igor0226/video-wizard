import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import {
	BlobStorageService,
	ProcessingHistoryService,
	type VideoRecord,
} from "../storage";
import { FfmpegAudioService } from "./audio-extract/ffmpeg-audio.service";
import { FfmpegComposeService } from "./composing-video/ffmpeg-compose.service";
import { PhraseDetectionService } from "./detecting-phrases/phrase-detection.service";
import { FfmpegDashService } from "./dash-encoding/ffmpeg-dash.service";
import { ExplanationClipService } from "./generating-clips/explanation-clip.service";
import {
	executeProcessingStep,
	skipProcessingStep,
} from "./processing-step-runner";
import { WhisperTranscriptionService } from "./transcribing/transcription.service";

type ExtractAudioResult = { audioRelativePath: string };
type TranscriptResult = { transcriptRelativePath: string };
type PhrasesResult = { phrasesRelativePath: string };
type ClipsResult = { clipsManifestRelativePath: string };
type ComposeResult = { enrichedRelativePath: string };
type DashResult = { segmentCount: number };

export type ProcessingResults = {
	audio: ExtractAudioResult;
	transcript: TranscriptResult;
	phrases: PhrasesResult;
	clips: ClipsResult;
	compose: ComposeResult;
	dash: DashResult;
};

type StepRunnerDeps = {
	processingHistory: ProcessingHistoryService;
	logger: PinoLogger;
};

@Injectable()
export class ProcessingPipelineService {
	constructor(
		@InjectPinoLogger(ProcessingPipelineService.name)
		private readonly logger: PinoLogger,
		private readonly ffmpegDashService: FfmpegDashService,
		private readonly ffmpegAudioService: FfmpegAudioService,
		private readonly ffmpegComposeService: FfmpegComposeService,
		private readonly transcriptionService: WhisperTranscriptionService,
		private readonly phraseDetectionService: PhraseDetectionService,
		private readonly explanationClipService: ExplanationClipService,
		private readonly blobStorage: BlobStorageService,
		private readonly processingHistory: ProcessingHistoryService,
	) {}

	async runProcessingPipeline(video: VideoRecord): Promise<ProcessingResults> {
		const audio = await this.extractAudioIfNeeded(video);
		const transcript = await this.transcribeIfNeeded(video, audio);
		const phrases = await this.detectPhrasesIfNeeded(video, transcript);
		const clips = await this.generateClipsIfNeeded(video, {
			phrases,
			transcript,
		});
		const compose = await this.composeVideoIfNeeded(video, clips);
		const dash = await this.encodeDashIfNeeded(video);
		return { audio, transcript, phrases, clips, compose, dash };
	}

	private getStepRunnerDeps(): StepRunnerDeps {
		return {
			processingHistory: this.processingHistory,
			logger: this.logger,
		};
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

	private async generateClipsIfNeeded(
		video: VideoRecord,
		input: { phrases: PhrasesResult; transcript: TranscriptResult },
	): Promise<ClipsResult> {
		const clipsManifestRelativePath =
			this.blobStorage.getClipsManifestRelativePath(video.id);

		if (await this.blobStorage.fileExists(clipsManifestRelativePath)) {
			return skipProcessingStep({
				deps: this.getStepRunnerDeps(),
				videoId: video.id,
				step: "generating_clips",
				logMessage: "explanation-clips-skip",
				result: { clipsManifestRelativePath },
			});
		}

		return executeProcessingStep({
			deps: this.getStepRunnerDeps(),
			videoId: video.id,
			step: "generating_clips",
			startLogMessage: "explanation-clips-start",
			run: async () => {
				const result = await this.explanationClipService.generateClips({
					video,
					phrasesRelativePath: input.phrases.phrasesRelativePath,
					transcriptRelativePath: input.transcript.transcriptRelativePath,
				});
				this.logger.info(
					{
						videoId: video.id,
						clipsManifestPath: result.clipsManifestRelativePath,
					},
					"explanation-clips-complete",
				);
				return result;
			},
		});
	}

	private async composeVideoIfNeeded(
		video: VideoRecord,
		clips: ClipsResult,
	): Promise<ComposeResult> {
		const enrichedRelativePath = this.blobStorage.getEnrichedVideoRelativePath(
			video.id,
		);

		if (await this.blobStorage.fileExists(enrichedRelativePath)) {
			return skipProcessingStep({
				deps: this.getStepRunnerDeps(),
				videoId: video.id,
				step: "composing_video",
				logMessage: "compose-video-skip",
				result: { enrichedRelativePath },
			});
		}

		return executeProcessingStep({
			deps: this.getStepRunnerDeps(),
			videoId: video.id,
			step: "composing_video",
			startLogMessage: "compose-video-start",
			run: async () => {
				const result = await this.ffmpegComposeService.composeVideo({
					video,
					clipsManifestRelativePath: clips.clipsManifestRelativePath,
				});
				this.logger.info(
					{
						videoId: video.id,
						enrichedPath: result.enrichedRelativePath,
					},
					"compose-video-complete",
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
}
