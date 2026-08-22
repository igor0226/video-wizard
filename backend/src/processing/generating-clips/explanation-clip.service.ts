import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, type VideoRecord } from "../../storage";
import {
	buildExplanationAss,
	resolveClosingCueTiming,
	resolveExplanationBodyTiming,
} from "./explanation-ass";
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
import { normalizeFfmpegError, runProcess } from "../shared/ffmpeg-process";
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

@Injectable()
export class ExplanationClipService {
	constructor(
		@InjectPinoLogger(ExplanationClipService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
		private readonly explanationTtsService: ExplanationTtsService,
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
		const sourceAbsolutePath =
			this.blobStorage.getStoragePathsForVideo(video).sourceAbsolutePath;
		const probe = await probeVideoFile(sourceAbsolutePath);
		const targetIntegratedLufs = await this.resolveSourceTargetLufs({
			sourceAbsolutePath,
			videoId: video.id,
		});

		const clips: ExplanationClipManifestEntry[] = [];
		for (const insertPoint of insertPoints) {
			const clip = await this.renderClip({
				video,
				insertPoint,
				probe,
				targetIntegratedLufs,
			});
			clips.push(clip);
		}

		const clipsManifestRelativePath =
			this.blobStorage.getClipsManifestRelativePath(video.id);
		await this.blobStorage.writeJson(clipsManifestRelativePath, { clips });

		this.logger.info(
			{ videoId: video.id, clipCount: clips.length },
			"explanation-clips-success",
		);

		return { clipsManifestRelativePath };
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
	}): Promise<ExplanationClipManifestEntry> {
		const { video, insertPoint, probe, targetIntegratedLufs } = input;
		const { index, phrase, insertAtSeconds, sentenceStartSeconds } = insertPoint;
		const paths = this.resolveClipPaths({ videoId: video.id, index });
		const combinedAudio = await this.buildCombinedClipAudio({
			video,
			index,
			phrase,
			audioAbsolutePath: paths.audioAbsolutePath,
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
		await writeFile(paths.assAbsolutePath, assContent, "utf8");
		await this.renderClipVideo({
			videoId: video.id,
			index,
			durationSeconds,
			audioAbsolutePath: paths.audioAbsolutePath,
			assAbsolutePath: paths.assAbsolutePath,
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

	private resolveClipPaths(input: { videoId: string; index: number }): {
		audioRelativePath: string;
		audioAbsolutePath: string;
		assAbsolutePath: string;
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
			audioAbsolutePath: this.blobStorage.resolveRelativePath(audioRelativePath),
			assAbsolutePath: this.blobStorage.resolveRelativePath(assRelativePath),
			videoRelativePath,
			videoAbsolutePath: this.blobStorage.resolveRelativePath(videoRelativePath),
		};
	}

	private async buildCombinedClipAudio(input: {
		video: VideoRecord;
		index: number;
		phrase: DetectedPhrase;
		audioAbsolutePath: string;
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
			});
		const closingAudio = await this.explanationTtsService.resolveClosingAudio(
			input.video.explanationLanguage,
		);
		const speechAbsolutePath =
			this.blobStorage.resolveRelativePath(speechRelativePath);

		try {
			await runProcess(
				"ffmpeg",
				buildConcatAudioArgs({
					speechAudioAbsolutePath: speechAbsolutePath,
					closingAudioAbsolutePath: closingAudio.absolutePath,
					midGapSeconds: CLOSING_GAP_SECONDS,
					outputAbsolutePath: input.audioAbsolutePath,
				}),
			);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}

		const ttsDurationSeconds =
			speechDurationSeconds +
			CLOSING_GAP_SECONDS +
			closingAudio.durationSeconds;

		return {
			audioAbsolutePath: input.audioAbsolutePath,
			speechDurationSeconds,
			closingDurationSeconds: closingAudio.durationSeconds,
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
