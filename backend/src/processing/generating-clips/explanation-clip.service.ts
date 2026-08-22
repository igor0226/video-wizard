import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, type VideoRecord } from "../../storage";
import { buildExplanationAss, resolveExplanationBodyTiming } from "./explanation-ass";
import {
	buildClipRenderArgs,
	CLIP_GAP_SECONDS,
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
		probe: Awaited<ReturnType<typeof probeVideoFile>>;
		targetIntegratedLufs: number;
	}): Promise<ExplanationClipManifestEntry> {
		const { video, insertPoint, probe, targetIntegratedLufs } = input;
		const { index, phrase, insertAtSeconds, sentenceStartSeconds } = insertPoint;
		const audioRelativePath = getClipAudioRelativePath(video.id, index);
		const assRelativePath = getClipAssRelativePath(video.id, index);
		const videoRelativePath = getClipVideoRelativePath(video.id, index);
		const audioAbsolutePath =
			this.blobStorage.resolveRelativePath(audioRelativePath);
		const assAbsolutePath =
			this.blobStorage.resolveRelativePath(assRelativePath);
		const videoAbsolutePath =
			this.blobStorage.resolveRelativePath(videoRelativePath);

		const listenAgainPhrase = getListenAgainPhrase(video.explanationLanguage);
		const clipExplanation = phrase.explanation.trim()
			? `${phrase.explanation.trim()} ${listenAgainPhrase}`
			: listenAgainPhrase;

		const { durationSeconds: ttsDurationSeconds } =
			await this.explanationTtsService.synthesizeSpeech({
				phrase: phrase.phrase,
				explanation: clipExplanation,
				explanationLanguage: video.explanationLanguage,
				outputRelativePath: audioRelativePath,
			});

		const durationSeconds = computeClipDurationSeconds(ttsDurationSeconds);
		const { bodyStartOffsetSeconds, bodyDurationSeconds } =
			resolveExplanationBodyTiming({
				phrase: phrase.phrase,
				explanation: clipExplanation,
				ttsDurationSeconds,
				clipGapSeconds: CLIP_GAP_SECONDS,
			});
		const assContent = buildExplanationAss({
			phrase: phrase.phrase,
			explanation: clipExplanation,
			durationSeconds,
			ttsDurationSeconds,
			bodyStartOffsetSeconds,
			bodyDurationSeconds,
			width: probe.width,
			height: probe.height,
		});
		await writeFile(assAbsolutePath, assContent, "utf8");

		const ttsLoudness = await probeLoudnormStats(audioAbsolutePath);
		const args = buildClipRenderArgs({
			width: probe.width,
			height: probe.height,
			fps: probe.fps,
			durationSeconds,
			audioAbsolutePath,
			assAbsolutePath,
			audioSampleRate: probe.audioSampleRate,
			audioChannels: probe.audioChannels,
			targetIntegratedLufs,
			ttsLoudness,
			outputAbsolutePath: videoAbsolutePath,
		});

		try {
			this.logger.info(
				{ videoId: video.id, index, output: videoAbsolutePath },
				"explanation-clip-render",
			);
			await runProcess("ffmpeg", args);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}

		return {
			index,
			phrase: phrase.phrase,
			insertAtSeconds,
			sentenceStartSeconds,
			durationSeconds,
			relativePath: path.posix.normalize(videoRelativePath),
		};
	}
}
