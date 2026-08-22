import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, type VideoRecord } from "../../storage";
import type { DetectedPhrase } from "../detecting-phrases/phrase-detection.service";
import type { ExplanationClipsManifest } from "../generating-clips/explanation-clip.service";
import {
	buildCompositionParts,
	buildExplanationsByIndex,
	buildPlaybackPhrases,
	type CompositionPart,
	type PlaybackPhrase,
} from "./compose-plan";
import {
	probeMediaDurationSeconds,
	probeVideoFile,
} from "../shared/ffmpeg-probe";
import { normalizeFfmpegError, runProcess } from "../shared/ffmpeg-process";

export type ComposeVideoInput = {
	video: VideoRecord;
	clipsManifestRelativePath: string;
};

export type ComposeVideoResult = {
	enrichedRelativePath: string;
};

type ComposeContext = {
	video: VideoRecord;
	enrichedRelativePath: string;
	enrichedAbsolutePath: string;
	enrichedDirectoryRelativePath: string;
	sourceAbsolutePath: string;
	manifest: ExplanationClipsManifest;
};

type VideoProbe = Awaited<ReturnType<typeof probeVideoFile>>;

@Injectable()
export class FfmpegComposeService {
	constructor(
		@InjectPinoLogger(FfmpegComposeService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
	) {}

	async composeVideo(input: ComposeVideoInput): Promise<ComposeVideoResult> {
		const context = await this.prepareComposeContext(input);

		if (context.manifest.clips.length === 0) {
			return this.composeWithoutClips(context);
		}

		return this.composeWithClips(context);
	}

	private async prepareComposeContext(
		input: ComposeVideoInput,
	): Promise<ComposeContext> {
		const { video, clipsManifestRelativePath } = input;
		await this.blobStorage.ensureLayout();

		const enrichedDirectoryRelativePath =
			this.blobStorage.getEnrichedDirectoryRelativePath(video.id);
		await this.blobStorage.ensureCleanDirectory(enrichedDirectoryRelativePath);

		const enrichedRelativePath = this.blobStorage.getEnrichedVideoRelativePath(
			video.id,
		);

		return {
			video,
			enrichedRelativePath,
			enrichedAbsolutePath:
				this.blobStorage.resolveRelativePath(enrichedRelativePath),
			enrichedDirectoryRelativePath,
			sourceAbsolutePath:
				this.blobStorage.getStoragePathsForVideo(video).sourceAbsolutePath,
			manifest: await this.readClipsManifest(clipsManifestRelativePath),
		};
	}

	private async readClipsManifest(
		clipsManifestRelativePath: string,
	): Promise<ExplanationClipsManifest> {
		return JSON.parse(
			await this.blobStorage.readText(clipsManifestRelativePath),
		) as ExplanationClipsManifest;
	}

	private async composeWithoutClips(
		context: ComposeContext,
	): Promise<ComposeVideoResult> {
		await this.copySourceToEnriched({
			sourceAbsolutePath: context.sourceAbsolutePath,
			enrichedAbsolutePath: context.enrichedAbsolutePath,
			videoId: context.video.id,
		});
		await this.writePlaybackPhrases({ videoId: context.video.id, phrases: [] });
		return { enrichedRelativePath: context.enrichedRelativePath };
	}

	private async composeWithClips(
		context: ComposeContext,
	): Promise<ComposeVideoResult> {
		const compositionPlan = await this.buildCompositionPlan(context);
		const partsDirectoryAbsolutePath = await this.preparePartsDirectory(
			context.enrichedDirectoryRelativePath,
		);
		const partPaths = await this.renderCompositionParts({
			context,
			parts: compositionPlan.parts,
			probe: compositionPlan.probe,
			partsDirectoryAbsolutePath,
		});

		await this.concatCompositionParts({
			videoId: context.video.id,
			partPaths,
			partsDirectoryAbsolutePath,
			enrichedAbsolutePath: context.enrichedAbsolutePath,
		});
		await this.persistPlaybackPhrasesFromParts({
			videoId: context.video.id,
			parts: compositionPlan.parts,
		});

		return { enrichedRelativePath: context.enrichedRelativePath };
	}

	private async buildCompositionPlan(context: ComposeContext): Promise<{
		parts: CompositionPart[];
		probe: VideoProbe;
	}> {
		const sourceDurationSeconds = await probeMediaDurationSeconds(
			context.sourceAbsolutePath,
		);
		const probe = await probeVideoFile(context.sourceAbsolutePath);

		return {
			parts: buildCompositionParts(
				context.manifest.clips,
				sourceDurationSeconds,
			),
			probe,
		};
	}

	private async preparePartsDirectory(
		enrichedDirectoryRelativePath: string,
	): Promise<string> {
		const partsDirectoryRelativePath = path.posix.join(
			enrichedDirectoryRelativePath,
			"parts",
		);
		await this.blobStorage.ensureCleanDirectory(partsDirectoryRelativePath);
		return path.join(
			this.blobStorage.resolveRelativePath(enrichedDirectoryRelativePath),
			"parts",
		);
	}

	private async renderCompositionParts(input: {
		context: ComposeContext;
		parts: CompositionPart[];
		probe: VideoProbe;
		partsDirectoryAbsolutePath: string;
	}): Promise<string[]> {
		const partPaths: string[] = [];

		for (let index = 0; index < input.parts.length; index += 1) {
			const part = input.parts[index];
			const partAbsolutePath = path.join(
				input.partsDirectoryAbsolutePath,
				`part-${String(index).padStart(3, "0")}.mp4`,
			);
			partPaths.push(partAbsolutePath);

			if (part.kind === "source") {
				await this.renderSourcePart({
					sourceAbsolutePath: input.context.sourceAbsolutePath,
					outputAbsolutePath: partAbsolutePath,
					startSeconds: part.startSeconds,
					endSeconds: part.endSeconds,
					probe: input.probe,
					videoId: input.context.video.id,
				});
				continue;
			}

			await this.normalizeClipPart({
				clipAbsolutePath: this.blobStorage.resolveRelativePath(
					part.clip.relativePath,
				),
				outputAbsolutePath: partAbsolutePath,
				probe: input.probe,
				videoId: input.context.video.id,
			});
		}

		return partPaths;
	}

	private async concatCompositionParts(input: {
		videoId: string;
		partPaths: string[];
		partsDirectoryAbsolutePath: string;
		enrichedAbsolutePath: string;
	}): Promise<void> {
		const concatListAbsolutePath = path.join(
			input.partsDirectoryAbsolutePath,
			"concat.txt",
		);
		const concatList = input.partPaths
			.map((partPath) => `file '${partPath.replace(/'/g, "'\\''")}'`)
			.join("\n");
		await writeFile(concatListAbsolutePath, concatList, "utf8");

		try {
			this.logger.info(
				{ videoId: input.videoId, partCount: input.partPaths.length },
				"compose-concat-start",
			);
			await runProcess("ffmpeg", [
				"-y",
				"-f",
				"concat",
				"-safe",
				"0",
				"-i",
				concatListAbsolutePath,
				"-c",
				"copy",
				input.enrichedAbsolutePath,
			]);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}

		this.logger.info(
			{ videoId: input.videoId, output: input.enrichedAbsolutePath },
			"compose-success",
		);
	}

	private async persistPlaybackPhrasesFromParts(input: {
		videoId: string;
		parts: CompositionPart[];
	}): Promise<void> {
		const phrasesFile = JSON.parse(
			await this.blobStorage.readText(
				this.blobStorage.getPhrasesRelativePath(input.videoId),
			),
		) as { phrases: DetectedPhrase[] };
		const explanationsByIndex = buildExplanationsByIndex(phrasesFile.phrases);
		const playbackPhrases = buildPlaybackPhrases({
			parts: input.parts,
			explanationsByIndex,
		});

		await this.writePlaybackPhrases({
			videoId: input.videoId,
			phrases: playbackPhrases,
		});
	}

	private async writePlaybackPhrases(input: {
		videoId: string;
		phrases: PlaybackPhrase[];
	}): Promise<void> {
		await this.blobStorage.writeJson(
			this.blobStorage.getPlaybackPhrasesRelativePath(input.videoId),
			{ phrases: input.phrases },
		);
	}

	private async copySourceToEnriched(input: {
		sourceAbsolutePath: string;
		enrichedAbsolutePath: string;
		videoId: string;
	}): Promise<void> {
		try {
			this.logger.info(
				{ videoId: input.videoId, output: input.enrichedAbsolutePath },
				"compose-copy-start",
			);
			await runProcess("ffmpeg", [
				"-y",
				"-i",
				input.sourceAbsolutePath,
				"-c",
				"copy",
				input.enrichedAbsolutePath,
			]);
		} catch (_error) {
			this.logger.warn(
				{ videoId: input.videoId },
				"compose-copy-failed-reencoding",
			);
			await runProcess("ffmpeg", [
				"-y",
				"-i",
				input.sourceAbsolutePath,
				"-c:v",
				"libx264",
				"-preset",
				"veryfast",
				"-crf",
				"23",
				"-c:a",
				"aac",
				"-b:a",
				"128k",
				input.enrichedAbsolutePath,
			]).catch((reencodeError) => {
				throw normalizeFfmpegError(reencodeError);
			});
		}
	}

	private async renderSourcePart(input: {
		sourceAbsolutePath: string;
		outputAbsolutePath: string;
		startSeconds: number;
		endSeconds: number;
		probe: VideoProbe;
		videoId: string;
	}): Promise<void> {
		const durationSeconds = input.endSeconds - input.startSeconds;
		if (durationSeconds <= 0) {
			throw new Error("Invalid source part duration");
		}

		try {
			await runProcess("ffmpeg", [
				"-y",
				"-ss",
				String(input.startSeconds),
				"-i",
				input.sourceAbsolutePath,
				"-t",
				String(durationSeconds),
				"-map",
				"0:v:0",
				"-map",
				"0:a:0?",
				"-c:v",
				"libx264",
				"-preset",
				"veryfast",
				"-crf",
				"23",
				"-pix_fmt",
				"yuv420p",
				"-r",
				String(input.probe.fps),
				"-c:a",
				"aac",
				"-b:a",
				"128k",
				"-ar",
				String(input.probe.audioSampleRate),
				"-ac",
				String(input.probe.audioChannels),
				input.outputAbsolutePath,
			]);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}
	}

	private async normalizeClipPart(input: {
		clipAbsolutePath: string;
		outputAbsolutePath: string;
		probe: VideoProbe;
		videoId: string;
	}): Promise<void> {
		try {
			await runProcess("ffmpeg", [
				"-y",
				"-i",
				input.clipAbsolutePath,
				"-map",
				"0:v:0",
				"-map",
				"0:a:0?",
				"-c:v",
				"libx264",
				"-preset",
				"veryfast",
				"-crf",
				"23",
				"-pix_fmt",
				"yuv420p",
				"-r",
				String(input.probe.fps),
				"-c:a",
				"aac",
				"-b:a",
				"128k",
				"-ar",
				String(input.probe.audioSampleRate),
				"-ac",
				String(input.probe.audioChannels),
				input.outputAbsolutePath,
			]);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}
	}
}
