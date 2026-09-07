import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Repository } from "typeorm";

import type { ProcessingHistory } from "../models";
import { ProcessingHistoryService } from "./processing-history.service";

describe("ProcessingHistoryService", () => {
	let service: ProcessingHistoryService;
	const saved = new Map<string, ProcessingHistory>();

	beforeEach(() => {
		saved.clear();
		const historyRepository = {
			findOne: vi.fn(async ({ where }: { where: { videoId: string } }) => {
				return saved.get(where.videoId) ?? null;
			}),
			save: vi.fn(async (history: ProcessingHistory) => {
				saved.set(history.videoId, history);
				return history;
			}),
		} as unknown as Repository<ProcessingHistory>;
		service = new ProcessingHistoryService(historyRepository);
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
		await service.recordStepComplete({
			videoId: "video-1",
			step: "audio_extract",
		});
		await service.recordStepStart("video-1", "transcribing");
		await service.recordFailure({
			videoId: "video-1",
			step: "transcribing",
			message: "Whisper failed",
		});
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
		await service.recordStepComplete({
			videoId: "video-1",
			step: "audio_extract",
			message: "skipped (already present)",
		});

		const history = await service.getHistory("video-1");
		expect(history.events.at(-1)).toMatchObject({
			step: "audio_extract",
			status: "completed",
			message: "skipped (already present)",
		});
	});

	it("records retry and sets current step to resume point", async () => {
		await service.initHistory("video-1");
		await service.recordFailure({
			videoId: "video-1",
			step: "transcribing",
			message: "Whisper failed",
		});

		const history = await service.recordRetry("video-1", "transcribing");

		expect(history.currentStep).toBe("transcribing");
		expect(history.events.at(-1)).toMatchObject({
			step: "transcribing",
			status: "started",
			message: "retry requested",
		});
	});
});
