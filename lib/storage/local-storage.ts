import type {
	BlobStorage,
	CreateVideoInput,
	VideoRecord,
	VideoRepository,
} from "./types";
import { randomUUID } from "node:crypto";
import {
	mkdir,
	readdir,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "videos");
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

async function ensureDir(dirPath: string): Promise<void> {
	await mkdir(dirPath, { recursive: true });
}

async function readRecordFile(recordPath: string): Promise<VideoRecord> {
	const content = await readFile(recordPath, "utf8");
	return JSON.parse(content) as VideoRecord;
}

async function isDirectory(absolutePath: string): Promise<boolean> {
	try {
		const entry = await stat(absolutePath);
		return entry.isDirectory();
	} catch {
		return false;
	}
}

const localBlobStorage: BlobStorage = {
	async ensureLayout() {
		await Promise.all([
			ensureDir(path.join(STORAGE_ROOT, UPLOADS_DIR)),
			ensureDir(path.join(STORAGE_ROOT, DASH_DIR)),
			ensureDir(path.join(STORAGE_ROOT, RECORDS_DIR)),
		]);
	},

	async writeUploadFile(relativePath, fileBuffer) {
		const absolutePath = this.resolveRelativePath(relativePath);
		await ensureDir(path.dirname(absolutePath));
		await writeFile(absolutePath, fileBuffer);
	},

	async readText(relativePath) {
		const absolutePath = this.resolveRelativePath(relativePath);
		return readFile(absolutePath, "utf8");
	},

	async readBytes(relativePath) {
		const absolutePath = this.resolveRelativePath(relativePath);
		return readFile(absolutePath);
	},

	resolveRelativePath(relativePath) {
		const normalized = path.normalize(relativePath);
		const absolutePath = path.join(STORAGE_ROOT, normalized);
		const normalizedRoot = `${path.normalize(STORAGE_ROOT)}${path.sep}`;
		if (!path.normalize(absolutePath).startsWith(normalizedRoot)) {
			throw new Error("Invalid storage path");
		}
		return absolutePath;
	},

	async ensureCleanDirectory(relativePath) {
		const absolutePath = this.resolveRelativePath(relativePath);
		await rm(absolutePath, { recursive: true, force: true });
		await ensureDir(absolutePath);
		return absolutePath;
	},

	async listFiles(relativePath) {
		const absolutePath = this.resolveRelativePath(relativePath);
		const entries = await readdir(absolutePath, { withFileTypes: true });
		return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
	},

	async fileExists(relativePath) {
		const absolutePath = this.resolveRelativePath(relativePath);
		try {
			const entry = await stat(absolutePath);
			return entry.isFile();
		} catch {
			return false;
		}
	},
};

const localVideoRepository: VideoRepository = {
	async createVideo(input: CreateVideoInput) {
		await localBlobStorage.ensureLayout();

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
		};

		await localBlobStorage.writeUploadFile(
			sourceRelativePath,
			input.fileBuffer,
		);
		const recordPath = localBlobStorage.resolveRelativePath(
			path.posix.join(RECORDS_DIR, toRecordFileName(videoId)),
		);
		await writeFile(recordPath, JSON.stringify(record, null, 2), "utf8");
		return record;
	},

	async listVideos() {
		await localBlobStorage.ensureLayout();
		const recordsPath = localBlobStorage.resolveRelativePath(RECORDS_DIR);
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
	},

	async getVideoById(videoId) {
		await localBlobStorage.ensureLayout();
		const recordPath = localBlobStorage.resolveRelativePath(
			path.posix.join(RECORDS_DIR, toRecordFileName(videoId)),
		);
		try {
			return await readRecordFile(recordPath);
		} catch {
			return null;
		}
	},

	async updateVideo(videoId, patch) {
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

		const recordPath = localBlobStorage.resolveRelativePath(
			path.posix.join(RECORDS_DIR, toRecordFileName(videoId)),
		);
		await writeFile(recordPath, JSON.stringify(updated, null, 2), "utf8");
		return updated;
	},

	async getNextPendingVideo() {
		const videos = await this.listVideos();
		const pending = videos
			.filter((video) => video.status === "pending")
			.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
		return pending[0] ?? null;
	},
};

export function getStoragePathsForVideo(video: VideoRecord): {
	sourceAbsolutePath: string;
	dashAbsolutePath: string;
	manifestAbsolutePath: string;
} {
	const dashRelativeManifest = path.posix.join(
		video.dashRelativePath,
		video.manifestFileName,
	);
	return {
		sourceAbsolutePath: localBlobStorage.resolveRelativePath(
			video.sourceRelativePath,
		),
		dashAbsolutePath: localBlobStorage.resolveRelativePath(
			video.dashRelativePath,
		),
		manifestAbsolutePath:
			localBlobStorage.resolveRelativePath(dashRelativeManifest),
	};
}

export const blobStorage = localBlobStorage;
export const videoRepository = localVideoRepository;
