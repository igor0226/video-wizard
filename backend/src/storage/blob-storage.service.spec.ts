import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BlobStorageService } from "./blob-storage.service";
import { createS3Client, createS3ConfigProvider } from "./s3-client.provider";

describe("BlobStorageService", () => {
	let service: BlobStorageService;
	const testPrefix = `test-${randomUUID()}`;

	beforeEach(async () => {
		service = new BlobStorageService(
			createS3Client(),
			createS3ConfigProvider(),
		);
		await service.ensureLayout();
	});

	afterEach(async () => {
		await service.ensureCleanDirectory(testPrefix);
	});

	it("writes and reads text via relative paths", async () => {
		const relativePath = `${testPrefix}/explanations/video-1/clips/000.ass`;
		const contents = "[Script Info]\nTitle: test\n";

		await service.writeText(relativePath, contents);

		expect(await service.readText(relativePath)).toBe(contents);
	});
});

describe("BlobStorageService.clearProcessingArtifactsFromStep", () => {
	let service: BlobStorageService;
	const createdVideoIds: string[] = [];

	beforeEach(async () => {
		service = new BlobStorageService(
			createS3Client(),
			createS3ConfigProvider(),
		);
		await service.ensureLayout();
		createdVideoIds.length = 0;
	});

	afterEach(async () => {
		for (const videoId of createdVideoIds) {
			await service.clearProcessingArtifactsFromStep(videoId, "audio_extract");
		}
	});

	async function writeStorageFile(
		videoId: string,
		relativePath: string,
		contents: string,
	): Promise<void> {
		createdVideoIds.push(videoId);
		await service.writeText(relativePath, contents);
	}

	it("keeps phrases.json when retrying from generating_clips", async () => {
		const videoId = randomUUID();
		await writeStorageFile(
			videoId,
			`explanations/${videoId}/phrases.json`,
			'{"phrases":[]}',
		);
		await writeStorageFile(
			videoId,
			`explanations/${videoId}/clips.json`,
			'{"clips":[]}',
		);
		await writeStorageFile(
			videoId,
			`explanations/${videoId}/clips/000.mp4`,
			"clip",
		);
		await writeStorageFile(
			videoId,
			`enriched/${videoId}/output.mp4`,
			"enriched",
		);

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
		const videoId = randomUUID();
		await writeStorageFile(
			videoId,
			`explanations/${videoId}/phrases.json`,
			'{"phrases":[]}',
		);
		await writeStorageFile(
			videoId,
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
		const videoId = randomUUID();
		await writeStorageFile(
			videoId,
			`explanations/${videoId}/phrases.json`,
			'{"phrases":[]}',
		);
		await writeStorageFile(
			videoId,
			`explanations/${videoId}/clips.json`,
			'{"clips":[]}',
		);
		await writeStorageFile(
			videoId,
			`enriched/${videoId}/output.mp4`,
			"enriched",
		);
		await writeStorageFile(videoId, `dash/${videoId}/manifest.mpd`, "mpd");

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
