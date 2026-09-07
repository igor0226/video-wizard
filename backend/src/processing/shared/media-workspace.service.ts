import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { Injectable } from "@nestjs/common";

import { BlobStorageService } from "../../storage";
import { resolveMediaWorkspaceRoot } from "./utils/resolve-media-workspace-root";

export class MediaWorkspace {
	constructor(
		readonly dir: string,
		private readonly blobStorage: BlobStorageService,
	) {}

	async download(input: { key: string; relative: string }): Promise<string> {
		const localPath = await this.localPath(input.relative);
		const stream = await this.blobStorage.getObjectStream(input.key);
		await pipeline(stream, createWriteStream(localPath));
		const sizeBytes = await this.getLocalFileSizeBytes(localPath);
		if (sizeBytes <= 0) {
			throw new Error(`Downloaded object is empty: ${input.key}`);
		}
		return localPath;
	}

	async downloadPrefix(input: {
		prefix: string;
		relativeDir: string;
	}): Promise<void> {
		const normalizedPrefix = input.prefix.endsWith("/")
			? input.prefix
			: `${input.prefix}/`;
		const keys = await this.blobStorage.listObjectKeys(normalizedPrefix);
		for (const key of keys) {
			const relative = path.posix.join(
				input.relativeDir,
				key.slice(normalizedPrefix.length),
			);
			await this.download({ key, relative });
		}
	}

	async localPath(relative: string): Promise<string> {
		const absolutePath = path.join(this.dir, relative);
		await mkdir(path.dirname(absolutePath), { recursive: true });
		return absolutePath;
	}

	async upload(input: { localPath: string; key: string }): Promise<void> {
		const buffer = await readFile(input.localPath);
		await this.blobStorage.writeUploadFile(input.key, buffer);
	}

	async uploadDir(input: { localDir: string; prefix: string }): Promise<void> {
		const entries = await readdir(input.localDir, { withFileTypes: true });
		for (const entry of entries) {
			const localPath = path.join(input.localDir, entry.name);
			if (entry.isDirectory()) {
				await this.uploadDir({
					localDir: localPath,
					prefix: path.posix.join(input.prefix, entry.name),
				});
				continue;
			}
			if (!entry.isFile()) {
				continue;
			}
			await this.upload({
				localPath,
				key: path.posix.join(input.prefix, entry.name),
			});
		}
	}

	async getLocalFileSizeBytes(localPath: string): Promise<number> {
		const entry = await stat(localPath);
		return entry.size;
	}

	async dispose(): Promise<void> {
		await rm(this.dir, { recursive: true, force: true });
	}
}

@Injectable()
export class MediaWorkspaceService {
	constructor(private readonly blobStorage: BlobStorageService) {}

	async create(label: string): Promise<MediaWorkspace> {
		const root = resolveMediaWorkspaceRoot();
		await mkdir(root, { recursive: true });
		const dir = await mkdtemp(path.join(root, `${label}-`));
		return new MediaWorkspace(dir, this.blobStorage);
	}
}
