import {
	mkdir,
	readdir,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";

import type { ProcessingStep, VideoRecord } from "./types";
import { resolveStorageRoot } from "./utils/resolve-storage-root";

const UPLOADS_DIR = "uploads";
const DASH_DIR = "dash";
const RECORDS_DIR = "records";
const AUDIO_DIR = "audio";
const TRANSCRIPTS_DIR = "transcripts";
const EXPLANATIONS_DIR = "explanations";
const ENRICHED_DIR = "enriched";
const HISTORY_DIR = "history";
const ASSETS_DIR = "assets";
const LISTEN_AGAIN_DIR = "listen-again";

async function ensureDir(dirPath: string): Promise<void> {
	await mkdir(dirPath, { recursive: true });
}

@Injectable()
export class BlobStorageService {
	getStorageRoot(): string {
		return resolveStorageRoot();
	}

	async ensureLayout(): Promise<void> {
		const storageRoot = this.getStorageRoot();
		await Promise.all([
			ensureDir(path.join(storageRoot, UPLOADS_DIR)),
			ensureDir(path.join(storageRoot, DASH_DIR)),
			ensureDir(path.join(storageRoot, RECORDS_DIR)),
			ensureDir(path.join(storageRoot, AUDIO_DIR)),
			ensureDir(path.join(storageRoot, TRANSCRIPTS_DIR)),
			ensureDir(path.join(storageRoot, EXPLANATIONS_DIR)),
			ensureDir(path.join(storageRoot, ENRICHED_DIR)),
			ensureDir(path.join(storageRoot, HISTORY_DIR)),
			ensureDir(path.join(storageRoot, ASSETS_DIR, LISTEN_AGAIN_DIR)),
		]);
	}

	async writeUploadFile(
		relativePath: string,
		fileBuffer: Buffer,
	): Promise<void> {
		const absolutePath = this.resolveRelativePath(relativePath);
		await ensureDir(path.dirname(absolutePath));
		await writeFile(absolutePath, fileBuffer);
	}

	async readText(relativePath: string): Promise<string> {
		const absolutePath = this.resolveRelativePath(relativePath);
		return readFile(absolutePath, "utf8");
	}

	async writeText(relativePath: string, contents: string): Promise<void> {
		const absolutePath = this.resolveRelativePath(relativePath);
		await ensureDir(path.dirname(absolutePath));
		await writeFile(absolutePath, contents, "utf8");
	}

	async readBytes(relativePath: string): Promise<Buffer> {
		const absolutePath = this.resolveRelativePath(relativePath);
		return readFile(absolutePath);
	}

	async writeJson(relativePath: string, data: unknown): Promise<void> {
		const absolutePath = this.resolveRelativePath(relativePath);
		await ensureDir(path.dirname(absolutePath));
		await writeFile(absolutePath, JSON.stringify(data, null, 2), "utf8");
	}

	async getFileSizeBytes(relativePath: string): Promise<number> {
		const absolutePath = this.resolveRelativePath(relativePath);
		const entry = await stat(absolutePath);
		return entry.size;
	}

	resolveRelativePath(relativePath: string): string {
		const storageRoot = this.getStorageRoot();
		const normalized = path.normalize(relativePath);
		const absolutePath = path.join(storageRoot, normalized);
		const normalizedRoot = `${path.normalize(storageRoot)}${path.sep}`;
		if (!path.normalize(absolutePath).startsWith(normalizedRoot)) {
			throw new Error("Invalid storage path");
		}
		return absolutePath;
	}

	async ensureCleanDirectory(relativePath: string): Promise<string> {
		const absolutePath = this.resolveRelativePath(relativePath);
		await rm(absolutePath, { recursive: true, force: true });
		await ensureDir(absolutePath);
		return absolutePath;
	}

	async listFiles(relativePath: string): Promise<string[]> {
		const absolutePath = this.resolveRelativePath(relativePath);
		const entries = await readdir(absolutePath, { withFileTypes: true });
		return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
	}

	async fileExists(relativePath: string): Promise<boolean> {
		const absolutePath = this.resolveRelativePath(relativePath);
		try {
			const entry = await stat(absolutePath);
			return entry.isFile();
		} catch {
			return false;
		}
	}

	getStoragePathsForVideo(video: VideoRecord): {
		sourceAbsolutePath: string;
		dashAbsolutePath: string;
		manifestAbsolutePath: string;
	} {
		const dashRelativeManifest = path.posix.join(
			video.dashRelativePath,
			video.manifestFileName,
		);
		return {
			sourceAbsolutePath: this.resolveRelativePath(video.sourceRelativePath),
			dashAbsolutePath: this.resolveRelativePath(video.dashRelativePath),
			manifestAbsolutePath: this.resolveRelativePath(dashRelativeManifest),
		};
	}

	getAudioRelativePath(videoId: string): string {
		return path.posix.join(AUDIO_DIR, videoId, "track.mp3");
	}

	getAudioDirectoryRelativePath(videoId: string): string {
		return path.posix.join(AUDIO_DIR, videoId);
	}

	getTranscriptRelativePath(videoId: string): string {
		return path.posix.join(TRANSCRIPTS_DIR, videoId, "transcript.json");
	}

	getTranscriptDirectoryRelativePath(videoId: string): string {
		return path.posix.join(TRANSCRIPTS_DIR, videoId);
	}

	getPhrasesRelativePath(videoId: string): string {
		return path.posix.join(EXPLANATIONS_DIR, videoId, "phrases.json");
	}

	getExplanationsDirectoryRelativePath(videoId: string): string {
		return path.posix.join(EXPLANATIONS_DIR, videoId);
	}

	getClipsManifestRelativePath(videoId: string): string {
		return path.posix.join(EXPLANATIONS_DIR, videoId, "clips.json");
	}

	getClipsDirectoryRelativePath(videoId: string): string {
		return path.posix.join(EXPLANATIONS_DIR, videoId, "clips");
	}

	getEnrichedDirectoryRelativePath(videoId: string): string {
		return path.posix.join(ENRICHED_DIR, videoId);
	}

	getEnrichedVideoRelativePath(videoId: string): string {
		return path.posix.join(ENRICHED_DIR, videoId, "output.mp4");
	}

	getPlaybackPhrasesRelativePath(videoId: string): string {
		return path.posix.join(ENRICHED_DIR, videoId, "playback-phrases.json");
	}

	getListenAgainAssetRelativePath(language: string): string {
		return path.posix.join(ASSETS_DIR, LISTEN_AGAIN_DIR, `${language}.mp3`);
	}

	getDashDirectoryRelativePath(videoId: string): string {
		return path.posix.join(DASH_DIR, videoId);
	}

	async clearProcessingArtifactsFromStep(
		videoId: string,
		fromStep: ProcessingStep,
	): Promise<void> {
		const directories: string[] = [];
		const files: string[] = [];

		if (fromStep === "audio_extract") {
			directories.push(
				this.getAudioDirectoryRelativePath(videoId),
				this.getTranscriptDirectoryRelativePath(videoId),
				this.getExplanationsDirectoryRelativePath(videoId),
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
		} else if (fromStep === "transcribing") {
			directories.push(
				this.getTranscriptDirectoryRelativePath(videoId),
				this.getExplanationsDirectoryRelativePath(videoId),
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
		} else if (fromStep === "detecting_phrases") {
			directories.push(
				this.getExplanationsDirectoryRelativePath(videoId),
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
		} else if (fromStep === "generating_clips") {
			directories.push(
				this.getClipsDirectoryRelativePath(videoId),
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
			files.push(this.getClipsManifestRelativePath(videoId));
		} else if (fromStep === "composing_video") {
			directories.push(
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
		} else if (fromStep === "dash_encoding") {
			directories.push(this.getDashDirectoryRelativePath(videoId));
		}

		await Promise.all([
			...directories.map((relativePath) =>
				rm(this.resolveRelativePath(relativePath), {
					recursive: true,
					force: true,
				}),
			),
			...files.map((relativePath) =>
				rm(this.resolveRelativePath(relativePath), { force: true }),
			),
		]);
	}
}
