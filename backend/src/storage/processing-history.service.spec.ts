import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "./blob-storage.service";
import { ProcessingHistoryService } from "./processing-history.service";

describe("ProcessingHistoryService", () => {
	let blobStorage: BlobStorageService;
	let service: ProcessingHistoryService;
	const written = new Map<string, unknown>();

	beforeEach(() => {
		written.clear();
		blobStorage = {
			ensureLayout: vi.fn(async () => undefined),
			readText: vi.fn(async (relativePath: string) => {
				const data = written.get(relativePath);
				if (!data) {
					throw new Error("ENOENT");
				}
				return JSON.stringify(data);
			}),
			writeJson: vi.fn(async (relativePath: string, data: unknown) => {
				written.set(relativePath, data);
			}),
		} as unknown as BlobStorageService;
		service = new ProcessingHistoryService(blobStorage);
	});

	it("initializes history with queued step", async () => {
		const history = await service.initHistory("video-1");

		expect(history).toMatchObject({
			videoId: "video-1",
			currentStep: "queued",
		});
		expect(history.events).toHaveLength(1);
		expect(history.events[0]).toMatchObject({
			step: "queued",
			status: "started",
		});
	});

	it("records step start, complete, failure, and completion", async () => {
		await service.initHistory("video-1");
		await service.recordStepStart("video-1", "audio_extract");
		await service.recordStepComplete("video-1", "audio_extract");
		await service.recordStepStart("video-1", "transcribing");
		await service.recordFailure("video-1", "transcribing", "Whisper failed");
		await service.initHistory("video-2");
		await service.markCompleted("video-2");

		const failed = await service.getHistory("video-1");
		expect(failed.currentStep).toBe("failed");
		expect(failed.events.at(-1)).toMatchObject({
			step: "transcribing",
			status: "failed",
			message: "Whisper failed",
		});

		const completed = await service.getHistory("video-2");
		expect(completed.currentStep).toBe("completed");
	});

	it("returns default history when file is missing", async () => {
		const history = await service.getHistory("missing-video");

		expect(history).toMatchObject({
			videoId: "missing-video",
			currentStep: "queued",
			events: [],
		});
	});

	it("records skipped step completion with message", async () => {
		await service.initHistory("video-1");
		await service.recordStepComplete(
			"video-1",
			"audio_extract",
			"skipped (already present)",
		);

		const history = await service.getHistory("video-1");
		expect(history.events.at(-1)).toMatchObject({
			step: "audio_extract",
			status: "completed",
			message: "skipped (already present)",
		});
	});

	it("records retry and sets current step to resume point", async () => {
		await service.initHistory("video-1");
		await service.recordFailure("video-1", "transcribing", "Whisper failed");

		const history = await service.recordRetry("video-1", "transcribing");

		expect(history.currentStep).toBe("transcribing");
		expect(history.events.at(-1)).toMatchObject({
			step: "transcribing",
			status: "started",
			message: "retry requested",
		});
	});
});
