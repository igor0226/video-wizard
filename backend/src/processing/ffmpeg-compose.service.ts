import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, type VideoRecord } from "../storage";
import type { ExplanationClipsManifest } from "./explanation-clip.service";
import { buildCompositionParts } from "./compose-plan";
import { probeMediaDurationSeconds, probeVideoFile } from "./ffmpeg-probe";
import { normalizeFfmpegError, runProcess } from "./ffmpeg-process";

export type ComposeVideoInput = {
	video: VideoRecord;
	clipsManifestRelativePath: string;
};

export type ComposeVideoResult = {
	enrichedRelativePath: string;
};

@Injectable()
export class FfmpegComposeService {
	constructor(
		@InjectPinoLogger(FfmpegComposeService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
	) {}

	async composeVideo(input: ComposeVideoInput): Promise<ComposeVideoResult> {
		const { video, clipsManifestRelativePath } = input;
		await this.blobStorage.ensureLayout();

		const enrichedDirectoryRelativePath =
			this.blobStorage.getEnrichedDirectoryRelativePath(video.id);
		await this.blobStorage.ensureCleanDirectory(enrichedDirectoryRelativePath);

		const enrichedRelativePath = this.blobStorage.getEnrichedVideoRelativePath(
			video.id,
		);
		const enrichedAbsolutePath =
			this.blobStorage.resolveRelativePath(enrichedRelativePath);
		const { sourceAbsolutePath } =
			this.blobStorage.getStoragePathsForVideo(video);

		const manifest = JSON.parse(
			await this.blobStorage.readText(clipsManifestRelativePath),
		) as ExplanationClipsManifest;

		if (manifest.clips.length === 0) {
			await this.copySourceToEnriched({
				sourceAbsolutePath,
				enrichedAbsolutePath,
				videoId: video.id,
			});
			return { enrichedRelativePath };
		}

		const sourceDurationSeconds =
			await probeMediaDurationSeconds(sourceAbsolutePath);
		const probe = await probeVideoFile(sourceAbsolutePath);
		const parts = buildCompositionParts(manifest.clips, sourceDurationSeconds);
		const partsDirectoryAbsolutePath = path.join(
			this.blobStorage.resolveRelativePath(enrichedDirectoryRelativePath),
			"parts",
		);
		await this.blobStorage.ensureCleanDirectory(
			path.posix.join(enrichedDirectoryRelativePath, "parts"),
		);

		const partPaths: string[] = [];
		for (let index = 0; index < parts.length; index += 1) {
			const part = parts[index];
			const partAbsolutePath = path.join(
				partsDirectoryAbsolutePath,
				`part-${String(index).padStart(3, "0")}.mp4`,
			);
			partPaths.push(partAbsolutePath);

			if (part.kind === "source") {
				await this.renderSourcePart({
					sourceAbsolutePath,
					outputAbsolutePath: partAbsolutePath,
					startSeconds: part.startSeconds,
					endSeconds: part.endSeconds,
					probe,
					videoId: video.id,
				});
			} else {
				await this.normalizeClipPart({
					clipAbsolutePath: this.blobStorage.resolveRelativePath(
						part.clip.relativePath,
					),
					outputAbsolutePath: partAbsolutePath,
					probe,
					videoId: video.id,
				});
			}
		}

		const concatListAbsolutePath = path.join(
			partsDirectoryAbsolutePath,
			"concat.txt",
		);
		const concatList = partPaths
			.map((partPath) => `file '${partPath.replace(/'/g, "'\\''")}'`)
			.join("\n");
		await writeFile(concatListAbsolutePath, concatList, "utf8");

		try {
			this.logger.info(
				{ videoId: video.id, partCount: partPaths.length },
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
				enrichedAbsolutePath,
			]);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}

		this.logger.info(
			{ videoId: video.id, output: enrichedAbsolutePath },
			"compose-success",
		);

		return { enrichedRelativePath };
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
		probe: Awaited<ReturnType<typeof probeVideoFile>>;
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
		probe: Awaited<ReturnType<typeof probeVideoFile>>;
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
