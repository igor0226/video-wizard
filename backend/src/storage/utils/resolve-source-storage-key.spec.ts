import { describe, expect, it, vi } from "vitest";

import type { BlobStorageService } from "../blob-storage.service";
import type { VideoRecord } from "../types";
import { resolveSourceStorageKey } from "./resolve-source-storage-key";

describe("resolveSourceStorageKey", () => {
	const video = {
		id: "video-1",
		sourceRelativePath: "uploads/video-1/clip.mp4",
	} as VideoRecord;

	it("returns the recorded source path when the object exists", async () => {
		const blobStorage = {
			fileExists: vi.fn(async () => true),
			listObjectKeys: vi.fn(),
			getUploadDirectoryRelativePath: vi.fn(() => "uploads/video-1"),
		} as unknown as BlobStorageService;

		await expect(resolveSourceStorageKey(blobStorage, video)).resolves.toBe(
			"uploads/video-1/clip.mp4",
		);
		expect(blobStorage.listObjectKeys).not.toHaveBeenCalled();
	});

	it("falls back to the sole upload object when the recorded path is missing", async () => {
		const blobStorage = {
			fileExists: vi.fn(async () => false),
			listObjectKeys: vi.fn(async () => ["uploads/video-1/original-name.mp4"]),
			getUploadDirectoryRelativePath: vi.fn(() => "uploads/video-1"),
		} as unknown as BlobStorageService;

		await expect(resolveSourceStorageKey(blobStorage, video)).resolves.toBe(
			"uploads/video-1/original-name.mp4",
		);
	});

	it("throws when no upload objects exist", async () => {
		const blobStorage = {
			fileExists: vi.fn(async () => false),
			listObjectKeys: vi.fn(async () => []),
			getUploadDirectoryRelativePath: vi.fn(() => "uploads/video-1"),
		} as unknown as BlobStorageService;

		await expect(resolveSourceStorageKey(blobStorage, video)).rejects.toThrow(
			"Source upload not found for video video-1",
		);
	});
});
