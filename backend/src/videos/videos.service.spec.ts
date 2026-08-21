import { ConflictException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VideoRecord } from "../storage/types";
import { makeTestVideoRecord } from "../../test/helpers/make-test-video-record";
import { VideosService } from "./videos.service";

describe("VideosService", () => {
	const video = makeTestVideoRecord({
		status: "failed",
		failureReason: "Whisper failed",
	});

	let service: VideosService;
	const videoRepository = {
		getVideoById: vi.fn(async (): Promise<VideoRecord | null> => video),
		updateVideo: vi.fn(async (_id: string, patch: Partial<VideoRecord>) => ({
			...video,
			...patch,
		})),
	};
	const processingHistory = {
		getHistory: vi.fn(async () => ({
			videoId: "video-1",
			currentStep: "failed",
			events: [
				{
					step: "transcribing",
					status: "failed",
					at: "2026-01-01T00:00:00.000Z",
					message: "Whisper failed",
				},
			],
			updatedAt: "2026-01-01T00:00:00.000Z",
		})),
		recordRetry: vi.fn(async () => undefined),
	};
	const blobStorage = {
		clearProcessingArtifactsFromStep: vi.fn(async () => undefined),
		getPlaybackPhrasesRelativePath: vi.fn(
			(videoId: string) => `enriched/${videoId}/playback-phrases.json`,
		),
		fileExists: vi.fn(async () => false),
		readText: vi.fn(async () => '{"phrases":[]}'),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		service = new VideosService(
			videoRepository as never,
			processingHistory as never,
			blobStorage as never,
		);
	});

	it("retryFailedVideo resets failed video to pending from last failed step", async () => {
		const result = await service.retryFailedVideo("video-1");

		expect(result).toEqual({
			id: "video-1",
			status: "pending",
			resumeFromStep: "transcribing",
			failureReason: null,
		});
		expect(blobStorage.clearProcessingArtifactsFromStep).toHaveBeenCalledWith(
			"video-1",
			"transcribing",
		);
		expect(processingHistory.recordRetry).toHaveBeenCalledWith(
			"video-1",
			"transcribing",
		);
		expect(videoRepository.updateVideo).toHaveBeenCalledWith("video-1", {
			status: "pending",
			failureReason: null,
		});
	});

	it("retryFailedVideo throws NotFoundException for missing video", async () => {
		videoRepository.getVideoById.mockResolvedValueOnce(null);

		await expect(service.retryFailedVideo("missing")).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it("retryFailedVideo throws ConflictException for non-failed video", async () => {
		videoRepository.getVideoById.mockResolvedValueOnce({
			...video,
			status: "ready",
		});

		await expect(service.retryFailedVideo("video-1")).rejects.toBeInstanceOf(
			ConflictException,
		);
	});

	it("getPlaybackPhrasesForApi returns empty phrases when file is missing", async () => {
		const result = await service.getPlaybackPhrasesForApi("video-1");

		expect(result).toEqual({ videoId: "video-1", phrases: [] });
	});

	it("getPlaybackPhrasesForApi returns stored playback phrases", async () => {
		blobStorage.fileExists.mockResolvedValueOnce(true);
		blobStorage.readText.mockResolvedValueOnce(
			JSON.stringify({
				phrases: [
					{
						index: 0,
						phrase: "break the ice",
						explanation: "Start a conversation.",
						startSeconds: 10,
						endSeconds: 13,
					},
				],
			}),
		);

		const result = await service.getPlaybackPhrasesForApi("video-1");

		expect(result).toEqual({
			videoId: "video-1",
			phrases: [
				{
					index: 0,
					phrase: "break the ice",
					explanation: "Start a conversation.",
					startSeconds: 10,
					endSeconds: 13,
				},
			],
		});
	});

	it("getPlaybackPhrasesForApi throws NotFoundException for missing video", async () => {
		videoRepository.getVideoById.mockResolvedValueOnce(null);

		await expect(
			service.getPlaybackPhrasesForApi("missing"),
		).rejects.toBeInstanceOf(NotFoundException);
	});
});
