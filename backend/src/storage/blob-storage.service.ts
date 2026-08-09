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

import type { VideoRecord } from "./types";

const UPLOADS_DIR = "uploads";
const DASH_DIR = "dash";
const RECORDS_DIR = "records";

async function ensureDir(dirPath: string): Promise<void> {
	await mkdir(dirPath, { recursive: true });
}

function resolveStorageRoot(): string {
	return process.env.STORAGE_ROOT ?? path.join(process.cwd(), "..", "videos");
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

	async readBytes(relativePath: string): Promise<Buffer> {
		const absolutePath = this.resolveRelativePath(relativePath);
		return readFile(absolutePath);
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
}
