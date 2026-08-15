import { randomUUID } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";

import { BlobStorageService } from "./blob-storage.service";
import { ProcessingHistoryService } from "./processing-history.service";
import type { CreateVideoInput, VideoRecord } from "./types";

const UPLOADS_DIR = "uploads";
const DASH_DIR = "dash";
const RECORDS_DIR = "records";
const MANIFEST_FILE_NAME = "manifest.mpd";

function sanitizeTitle(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "Untitled video";
	}
	return trimmed.slice(0, 120);
}

function sanitizeFileName(value: string): string {
	const normalized = value
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^a-zA-Z0-9_.-]/g, "");
	return normalized || "upload.mp4";
}

function toRecordFileName(videoId: string): string {
	return `${videoId}.json`;
}

async function readRecordFile(recordPath: string): Promise<VideoRecord> {
	const content = await readFile(recordPath, "utf8");
	const parsed = JSON.parse(content) as Partial<VideoRecord>;
	return {
		...parsed,
		transcriptRelativePath: parsed.transcriptRelativePath ?? null,
		phrasesRelativePath: parsed.phrasesRelativePath ?? null,
		sourceLanguage: parsed.sourceLanguage ?? "",
		explanationLanguage: parsed.explanationLanguage ?? "",
		languageLevel: parsed.languageLevel ?? "B1",
	} as VideoRecord;
}

async function isDirectory(absolutePath: string): Promise<boolean> {
	try {
		const entry = await stat(absolutePath);
		return entry.isDirectory();
	} catch {
		return false;
	}
}

@Injectable()
export class VideoRepositoryService {
	constructor(
		private readonly blobStorage: BlobStorageService,
		private readonly processingHistory: ProcessingHistoryService,
	) {}

	async createVideo(input: CreateVideoInput): Promise<VideoRecord> {
		await this.blobStorage.ensureLayout();

		const videoId = randomUUID();
		const safeFileName = sanitizeFileName(input.originalFileName);
		const sourceRelativePath = path.posix.join(
			UPLOADS_DIR,
			videoId,
			safeFileName,
		);
		const dashRelativePath = path.posix.join(DASH_DIR, videoId);
		const nowIso = new Date().toISOString();

		const record: VideoRecord = {
			id: videoId,
			title: sanitizeTitle(input.title),
			originalFileName: safeFileName,
			mimeType: input.mimeType,
			sizeBytes: input.sizeBytes,
			sourceRelativePath,
			dashRelativePath,
			manifestFileName: MANIFEST_FILE_NAME,
			status: "pending",
			segmentCount: 0,
			createdAt: nowIso,
			updatedAt: nowIso,
			failureReason: null,
			transcriptRelativePath: null,
			phrasesRelativePath: null,
			sourceLanguage: input.sourceLanguage,
			explanationLanguage: input.explanationLanguage,
			languageLevel: input.languageLevel,
		};

		await this.blobStorage.writeUploadFile(
			sourceRelativePath,
			input.fileBuffer,
		);
		const recordPath = this.blobStorage.resolveRelativePath(
			path.posix.join(RECORDS_DIR, toRecordFileName(videoId)),
		);
		await writeFile(recordPath, JSON.stringify(record, null, 2), "utf8");
		await this.processingHistory.initHistory(videoId);
		return record;
	}

	async listVideos(): Promise<VideoRecord[]> {
		await this.blobStorage.ensureLayout();
		const recordsPath = this.blobStorage.resolveRelativePath(RECORDS_DIR);
		if (!(await isDirectory(recordsPath))) {
			return [];
		}

		const entries = await readdir(recordsPath, { withFileTypes: true });
		const records = await Promise.all(
			entries
				.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
				.map((entry) => readRecordFile(path.join(recordsPath, entry.name))),
		);

		return records.sort((left, right) =>
			right.createdAt.localeCompare(left.createdAt),
		);
	}

	async getVideoById(videoId: string): Promise<VideoRecord | null> {
		await this.blobStorage.ensureLayout();
		const recordPath = this.blobStorage.resolveRelativePath(
			path.posix.join(RECORDS_DIR, toRecordFileName(videoId)),
		);
		try {
			return await readRecordFile(recordPath);
		} catch {
			return null;
		}
	}

	async updateVideo(
		videoId: string,
		patch: Partial<VideoRecord>,
	): Promise<VideoRecord> {
		const existing = await this.getVideoById(videoId);
		if (!existing) {
			throw new Error(`Video not found: ${videoId}`);
		}

		const updated: VideoRecord = {
			...existing,
			...patch,
			id: existing.id,
			createdAt: existing.createdAt,
			updatedAt: new Date().toISOString(),
		};

		const recordPath = this.blobStorage.resolveRelativePath(
			path.posix.join(RECORDS_DIR, toRecordFileName(videoId)),
		);
		await writeFile(recordPath, JSON.stringify(updated, null, 2), "utf8");
		return updated;
	}

	async getNextPendingVideo(): Promise<VideoRecord | null> {
		const videos = await this.listVideos();
		const pending = videos
			.filter((video) => video.status === "pending")
			.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
		return pending[0] ?? null;
	}
}
