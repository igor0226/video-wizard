import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BlobStorageService } from "./blob-storage.service";

describe("BlobStorageService.clearProcessingArtifactsFromStep", () => {
	let storageRoot: string;
	let service: BlobStorageService;

	beforeEach(async () => {
		storageRoot = await mkdtemp(path.join(os.tmpdir(), "blob-storage-test-"));
		process.env.STORAGE_ROOT = storageRoot;
		service = new BlobStorageService();
		await service.ensureLayout();
	});

	afterEach(async () => {
		delete process.env.STORAGE_ROOT;
		await rm(storageRoot, { recursive: true, force: true });
	});

	async function writeStorageFile(
		relativePath: string,
		contents: string,
	): Promise<void> {
		const absolutePath = service.resolveRelativePath(relativePath);
		await mkdir(path.dirname(absolutePath), { recursive: true });
		await writeFile(absolutePath, contents, "utf8");
	}

	it("keeps phrases.json when retrying from generating_clips", async () => {
		const videoId = "video-1";
		await writeStorageFile(
			`explanations/${videoId}/phrases.json`,
			'{"phrases":[]}',
		);
		await writeStorageFile(
			`explanations/${videoId}/clips.json`,
			'{"clips":[]}',
		);
		await writeStorageFile(`explanations/${videoId}/clips/000.mp4`, "clip");
		await writeStorageFile(`enriched/${videoId}/output.mp4`, "enriched");

		await service.clearProcessingArtifactsFromStep(videoId, "generating_clips");

		expect(
			await service.fileExists(`explanations/${videoId}/phrases.json`),
		).toBe(true);
		expect(await service.fileExists(`explanations/${videoId}/clips.json`)).toBe(
			false,
		);
		expect(
			await service.fileExists(`explanations/${videoId}/clips/000.mp4`),
		).toBe(false);
		expect(await service.fileExists(`enriched/${videoId}/output.mp4`)).toBe(
			false,
		);
	});

	it("removes the entire explanations directory when retrying from detecting_phrases", async () => {
		const videoId = "video-2";
		await writeStorageFile(
			`explanations/${videoId}/phrases.json`,
			'{"phrases":[]}',
		);
		await writeStorageFile(
			`explanations/${videoId}/clips.json`,
			'{"clips":[]}',
		);

		await service.clearProcessingArtifactsFromStep(
			videoId,
			"detecting_phrases",
		);

		expect(
			await service.fileExists(`explanations/${videoId}/phrases.json`),
		).toBe(false);
		expect(await service.fileExists(`explanations/${videoId}/clips.json`)).toBe(
			false,
		);
	});

	it("removes only enriched and dash when retrying from composing_video", async () => {
		const videoId = "video-3";
		await writeStorageFile(
			`explanations/${videoId}/phrases.json`,
			'{"phrases":[]}',
		);
		await writeStorageFile(
			`explanations/${videoId}/clips.json`,
			'{"clips":[]}',
		);
		await writeStorageFile(`enriched/${videoId}/output.mp4`, "enriched");
		await writeStorageFile(`dash/${videoId}/manifest.mpd`, "mpd");

		await service.clearProcessingArtifactsFromStep(videoId, "composing_video");

		expect(
			await service.fileExists(`explanations/${videoId}/phrases.json`),
		).toBe(true);
		expect(await service.fileExists(`explanations/${videoId}/clips.json`)).toBe(
			true,
		);
		expect(await service.fileExists(`enriched/${videoId}/output.mp4`)).toBe(
			false,
		);
		expect(await service.fileExists(`dash/${videoId}/manifest.mpd`)).toBe(
			false,
		);
	});
});
