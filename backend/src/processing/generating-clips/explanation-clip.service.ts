import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, type VideoRecord } from "../../storage";
import {
	buildExplanationAss,
	resolveClosingCueTiming,
	resolveExplanationBodyTiming,
} from "./explanation-ass";
import { resolveClipGenerationConcurrency } from "./clip-generation-concurrency";
import {
	buildClipRenderArgs,
	buildConcatAudioArgs,
	CLIP_GAP_SECONDS,
	CLOSING_GAP_SECONDS,
	computeClipDurationSeconds,
} from "./explanation-clip-render";
import {
	buildPhraseInsertPoints,
	type PhraseInsertPoint,
	type TranscriptWithSegments,
} from "./insert-points";
import { getListenAgainPhrase } from "./listen-again";
import {
	ExplanationTtsService,
	getClipAssRelativePath,
	getClipAudioRelativePath,
	getClipSpeechAudioRelativePath,
	getClipVideoRelativePath,
} from "./explanation-tts.service";
import { probeVideoFile } from "../shared/ffmpeg-probe";
import {
	DEFAULT_INTEGRATED_LUFS,
	probeLoudnormStats,
	resolveTargetIntegratedLufs,
} from "../shared/ffmpeg-loudness";
import type { MediaWorkspace } from "../shared/media-workspace.service";
import { MediaWorkspaceService } from "../shared/media-workspace.service";
import { downloadSourceVideoToWorkspace } from "../shared/utils/download-source-video";
import { normalizeFfmpegError, runProcess } from "../shared/ffmpeg-process";
import { mapWithConcurrency } from "../shared/map-with-concurrency";
import type { DetectedPhrase } from "../detecting-phrases/phrase-detection.service";

export type ExplanationClipManifestEntry = {
	index: number;
	phrase: string;
	insertAtSeconds: number;
	sentenceStartSeconds: number;
	durationSeconds: number;
	relativePath: string;
};

export type ExplanationClipsManifest = {
	clips: ExplanationClipManifestEntry[];
};

export type GenerateClipsInput = {
	video: VideoRecord;
	phrasesRelativePath: string;
	transcriptRelativePath: string;
};

export type GenerateClipsResult = {
	clipsManifestRelativePath: string;
};

type PhrasesFile = {
	phrases: DetectedPhrase[];
};

type ClipProbe = Awaited<ReturnType<typeof probeVideoFile>>;

type CombinedClipAudio = {
	audioAbsolutePath: string;
	speechDurationSeconds: number;
	closingDurationSeconds: number;
	ttsDurationSeconds: number;
};

type ClosingAudio = {
	absolutePath: string;
	durationSeconds: number;
};

@Injectable()
export class ExplanationClipService {
	constructor(
		@InjectPinoLogger(ExplanationClipService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
		private readonly explanationTtsService: ExplanationTtsService,
		private readonly mediaWorkspace: MediaWorkspaceService,
	) {}

	async generateClips(input: GenerateClipsInput): Promise<GenerateClipsResult> {
		const { video, phrasesRelativePath, transcriptRelativePath } = input;
		await this.blobStorage.ensureLayout();

		const clipsDirectoryRelativePath =
			this.blobStorage.getClipsDirectoryRelativePath(video.id);
		await this.blobStorage.ensureCleanDirectory(clipsDirectoryRelativePath);

		const phrasesFile = JSON.parse(
			await this.blobStorage.readText(phrasesRelativePath),
		) as PhrasesFile;
		const transcript = JSON.parse(
			await this.blobStorage.readText(transcriptRelativePath),
		) as TranscriptWithSegments;

		const insertPoints = buildPhraseInsertPoints(
			phrasesFile.phrases,
			transcript,
		);
		const clipsManifestRelativePath =
			this.blobStorage.getClipsManifestRelativePath(video.id);

		if (insertPoints.length === 0) {
			await this.blobStorage.writeJson(clipsManifestRelativePath, {
				clips: [],
			});
			this.logger.info(
				{ videoId: video.id, clipCount: 0 },
				"explanation-clips-success",
			);
			return { clipsManifestRelativePath };
		}

		const workspace = await this.mediaWorkspace.create(`clips-${video.id}`);
		try {
			await mkdir(path.join(workspace.dir, "clips"), { recursive: true });
			const sourceAbsolutePath = await downloadSourceVideoToWorkspace({
				blobStorage: this.blobStorage,
				workspace,
				video,
			});
			const probe = await probeVideoFile(sourceAbsolutePath);
			const targetIntegratedLufs = await this.resolveSourceTargetLufs({
				sourceAbsolutePath,
				videoId: video.id,
			});
			const closingAudio = await this.explanationTtsService.resolveClosingAudio(
				{
					explanationLanguage: video.explanationLanguage,
					workspace,
				},
			);
			const concurrency = resolveClipGenerationConcurrency();

			this.logger.info(
				{
					videoId: video.id,
					clipCount: insertPoints.length,
					concurrency,
				},
				"explanation-clips-start",
			);

			const clips = await mapWithConcurrency({
				items: insertPoints,
				concurrency,
				mapper: (insertPoint) =>
					this.renderClip({
						video,
						insertPoint,
						probe,
						targetIntegratedLufs,
						closingAudio,
						workspace,
					}),
			});
			clips.sort((left, right) => left.index - right.index);

			await workspace.uploadDir({
				localDir: path.join(workspace.dir, "clips"),
				prefix: clipsDirectoryRelativePath,
			});
			await this.blobStorage.writeJson(clipsManifestRelativePath, { clips });

			this.logger.info(
				{ videoId: video.id, clipCount: clips.length },
				"explanation-clips-success",
			);

			return { clipsManifestRelativePath };
		} finally {
			await workspace.dispose();
		}
	}

	private async resolveSourceTargetLufs(input: {
		sourceAbsolutePath: string;
		videoId: string;
	}): Promise<number> {
		try {
			const sourceLoudness = await probeLoudnormStats(input.sourceAbsolutePath);
			const targetIntegratedLufs = resolveTargetIntegratedLufs(sourceLoudness);
			this.logger.info(
				{
					videoId: input.videoId,
					sourceIntegratedLufs: sourceLoudness.input_i,
					targetIntegratedLufs,
				},
				"explanation-clips-source-loudness",
			);
			return targetIntegratedLufs;
		} catch (error) {
			this.logger.warn(
				{ videoId: input.videoId, err: error },
				"explanation-clips-source-loudness-fallback",
			);
			return DEFAULT_INTEGRATED_LUFS;
		}
	}

	private async renderClip(input: {
		video: VideoRecord;
		insertPoint: PhraseInsertPoint;
		probe: ClipProbe;
		targetIntegratedLufs: number;
		closingAudio: ClosingAudio;
		workspace: MediaWorkspace;
	}): Promise<ExplanationClipManifestEntry> {
		const { video, insertPoint, probe, targetIntegratedLufs, closingAudio } =
			input;
		const { index, phrase, insertAtSeconds, sentenceStartSeconds } =
			insertPoint;
		const paths = this.resolveClipPaths({
			videoId: video.id,
			index,
			workspace: input.workspace,
		});
		const combinedAudio = await this.buildCombinedClipAudio({
			video,
			index,
			phrase,
			paths,
			closingAudio,
			workspace: input.workspace,
		});
		const durationSeconds = computeClipDurationSeconds(
			combinedAudio.ttsDurationSeconds,
		);
		const assContent = this.buildClipAss({
			phrase,
			explanationLanguage: video.explanationLanguage,
			durationSeconds,
			speechDurationSeconds: combinedAudio.speechDurationSeconds,
			closingDurationSeconds: combinedAudio.closingDurationSeconds,
			probe,
		});
		const assAbsolutePath = path.join(
			input.workspace.dir,
			"clips",
			path.basename(paths.assRelativePath),
		);
		await writeFile(assAbsolutePath, assContent, "utf8");
		await this.renderClipVideo({
			videoId: video.id,
			index,
			durationSeconds,
			audioAbsolutePath: paths.audioAbsolutePath,
			assAbsolutePath,
			videoAbsolutePath: paths.videoAbsolutePath,
			probe,
			targetIntegratedLufs,
		});

		return {
			index,
			phrase: phrase.phrase,
			insertAtSeconds,
			sentenceStartSeconds,
			durationSeconds,
			relativePath: path.posix.normalize(paths.videoRelativePath),
		};
	}

	private resolveClipPaths(input: {
		videoId: string;
		index: number;
		workspace: MediaWorkspace;
	}): {
		audioRelativePath: string;
		audioAbsolutePath: string;
		assRelativePath: string;
		videoRelativePath: string;
		videoAbsolutePath: string;
	} {
		const audioRelativePath = getClipAudioRelativePath(
			input.videoId,
			input.index,
		);
		const assRelativePath = getClipAssRelativePath(input.videoId, input.index);
		const videoRelativePath = getClipVideoRelativePath(
			input.videoId,
			input.index,
		);

		return {
			audioRelativePath,
			audioAbsolutePath: path.join(
				input.workspace.dir,
				"clips",
				path.basename(audioRelativePath),
			),
			assRelativePath,
			videoRelativePath,
			videoAbsolutePath: path.join(
				input.workspace.dir,
				"clips",
				path.basename(videoRelativePath),
			),
		};
	}

	private async buildCombinedClipAudio(input: {
		video: VideoRecord;
		index: number;
		phrase: DetectedPhrase;
		paths: ReturnType<ExplanationClipService["resolveClipPaths"]>;
		closingAudio: ClosingAudio;
		workspace: MediaWorkspace;
	}): Promise<CombinedClipAudio> {
		const speechRelativePath = getClipSpeechAudioRelativePath(
			input.video.id,
			input.index,
		);
		const { durationSeconds: speechDurationSeconds } =
			await this.explanationTtsService.synthesizeSpeech({
				phrase: input.phrase.phrase,
				explanation: input.phrase.explanation,
				explanationLanguage: input.video.explanationLanguage,
				outputRelativePath: speechRelativePath,
				workspace: input.workspace,
			});
		const speechAbsolutePath = path.join(
			input.workspace.dir,
			path.basename(speechRelativePath),
		);

		try {
			await runProcess(
				"ffmpeg",
				buildConcatAudioArgs({
					speechAudioAbsolutePath: speechAbsolutePath,
					closingAudioAbsolutePath: input.closingAudio.absolutePath,
					midGapSeconds: CLOSING_GAP_SECONDS,
					outputAbsolutePath: input.paths.audioAbsolutePath,
				}),
			);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}

		const ttsDurationSeconds =
			speechDurationSeconds +
			CLOSING_GAP_SECONDS +
			input.closingAudio.durationSeconds;

		return {
			audioAbsolutePath: input.paths.audioAbsolutePath,
			speechDurationSeconds,
			closingDurationSeconds: input.closingAudio.durationSeconds,
			ttsDurationSeconds,
		};
	}

	private buildClipAss(input: {
		phrase: DetectedPhrase;
		explanationLanguage: string;
		durationSeconds: number;
		speechDurationSeconds: number;
		closingDurationSeconds: number;
		probe: ClipProbe;
	}): string {
		const listenAgainPhrase = getListenAgainPhrase(input.explanationLanguage);
		const { bodyStartOffsetSeconds, bodyDurationSeconds } =
			resolveExplanationBodyTiming({
				phrase: input.phrase.phrase,
				explanation: input.phrase.explanation,
				ttsDurationSeconds: input.speechDurationSeconds,
				clipGapSeconds: CLIP_GAP_SECONDS,
			});
		const closingTiming = resolveClosingCueTiming({
			clipGapSeconds: CLIP_GAP_SECONDS,
			closingGapSeconds: CLOSING_GAP_SECONDS,
			speechDurationSeconds: input.speechDurationSeconds,
			closingDurationSeconds: input.closingDurationSeconds,
		});

		return buildExplanationAss({
			phrase: input.phrase.phrase,
			explanation: input.phrase.explanation,
			durationSeconds: input.durationSeconds,
			ttsDurationSeconds: input.speechDurationSeconds,
			bodyStartOffsetSeconds,
			bodyDurationSeconds,
			width: input.probe.width,
			height: input.probe.height,
			closingCue: {
				startSeconds: closingTiming.startSeconds,
				endSeconds: closingTiming.startSeconds + closingTiming.durationSeconds,
				text: listenAgainPhrase,
			},
		});
	}

	private async renderClipVideo(input: {
		videoId: string;
		index: number;
		durationSeconds: number;
		audioAbsolutePath: string;
		assAbsolutePath: string;
		videoAbsolutePath: string;
		probe: ClipProbe;
		targetIntegratedLufs: number;
	}): Promise<void> {
		const ttsLoudness = await probeLoudnormStats(input.audioAbsolutePath);
		const args = buildClipRenderArgs({
			width: input.probe.width,
			height: input.probe.height,
			fps: input.probe.fps,
			durationSeconds: input.durationSeconds,
			audioAbsolutePath: input.audioAbsolutePath,
			assAbsolutePath: input.assAbsolutePath,
			audioSampleRate: input.probe.audioSampleRate,
			audioChannels: input.probe.audioChannels,
			targetIntegratedLufs: input.targetIntegratedLufs,
			ttsLoudness,
			outputAbsolutePath: input.videoAbsolutePath,
		});

		try {
			this.logger.info(
				{
					videoId: input.videoId,
					index: input.index,
					output: input.videoAbsolutePath,
				},
				"explanation-clip-render",
			);
			await runProcess("ffmpeg", args);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}
	}
}
