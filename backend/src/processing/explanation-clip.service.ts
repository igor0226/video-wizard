import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, type VideoRecord } from "../storage";
import { buildExplanationAss } from "./explanation-ass";
import {
	buildPhraseInsertPoints,
	type PhraseInsertPoint,
	type TranscriptWithSegments,
} from "./insert-points";
import {
	ExplanationTtsService,
	getClipAssRelativePath,
	getClipAudioRelativePath,
	getClipVideoRelativePath,
} from "./explanation-tts.service";
import { probeVideoFile } from "./ffmpeg-probe";
import { normalizeFfmpegError, runProcess } from "./ffmpeg-process";
import type { DetectedPhrase } from "./phrase-detection.service";

const CLIP_PADDING_SECONDS = 0.3;

export type ExplanationClipManifestEntry = {
	index: number;
	phrase: string;
	insertAtSeconds: number;
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

		const clips: ExplanationClipManifestEntry[] = [];
		for (const insertPoint of insertPoints) {
			const clip = await this.renderClip({
				video,
				insertPoint,
				probe,
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

	private async renderClip(input: {
		video: VideoRecord;
		insertPoint: PhraseInsertPoint;
		probe: Awaited<ReturnType<typeof probeVideoFile>>;
	}): Promise<ExplanationClipManifestEntry> {
		const { video, insertPoint, probe } = input;
		const { index, phrase, insertAtSeconds } = insertPoint;
		const audioRelativePath = getClipAudioRelativePath(video.id, index);
		const assRelativePath = getClipAssRelativePath(video.id, index);
		const videoRelativePath = getClipVideoRelativePath(video.id, index);
		const audioAbsolutePath =
			this.blobStorage.resolveRelativePath(audioRelativePath);
		const assAbsolutePath =
			this.blobStorage.resolveRelativePath(assRelativePath);
		const videoAbsolutePath =
			this.blobStorage.resolveRelativePath(videoRelativePath);

		const { durationSeconds: ttsDurationSeconds } =
			await this.explanationTtsService.synthesizeSpeech({
				explanation: phrase.explanation,
				explanationLanguage: video.explanationLanguage,
				outputRelativePath: audioRelativePath,
			});

		const durationSeconds = ttsDurationSeconds + CLIP_PADDING_SECONDS;
		const assContent = buildExplanationAss({
			phrase: phrase.phrase,
			explanation: phrase.explanation,
			durationSeconds,
			width: probe.width,
			height: probe.height,
		});
		await writeFile(assAbsolutePath, assContent, "utf8");

		const escapedAssPath = assAbsolutePath.replace(/'/g, "'\\''");
		const args = [
			"-y",
			"-f",
			"lavfi",
			"-i",
			`color=c=0x111827:s=${probe.width}x${probe.height}:r=${probe.fps}:d=${durationSeconds}`,
			"-i",
			audioAbsolutePath,
			"-vf",
			`subtitles='${escapedAssPath}'`,
			"-c:v",
			"libx264",
			"-preset",
			"veryfast",
			"-crf",
			"23",
			"-pix_fmt",
			"yuv420p",
			"-c:a",
			"aac",
			"-b:a",
			"128k",
			"-ar",
			String(probe.audioSampleRate),
			"-ac",
			String(probe.audioChannels),
			"-shortest",
			videoAbsolutePath,
		];

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
			durationSeconds,
			relativePath: path.posix.normalize(videoRelativePath),
		};
	}
}
