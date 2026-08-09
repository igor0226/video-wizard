import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	BlobStorageService,
	ProcessingHistoryService,
	VideoRepositoryService,
} from "../storage";
import type { VideoRecord } from "../storage/types";
import { FfmpegAudioService } from "./ffmpeg-audio.service";
import { FfmpegDashService } from "./ffmpeg-dash.service";
import { JobsService } from "./jobs.service";
import { WhisperTranscriptionService } from "./transcription.service";

vi.mock("node:fs/promises", () => ({
	open: vi.fn(async () => ({
		close: vi.fn(async () => undefined),
	})),
	mkdir: vi.fn(async () => undefined),
	rm: vi.fn(async () => undefined),
}));

describe("JobsService", () => {
	const video: VideoRecord = {
		id: "video-1",
		title: "Test",
		originalFileName: "clip.mp4",
		mimeType: "video/mp4",
		sizeBytes: 100,
		sourceRelativePath: "uploads/video-1/clip.mp4",
		dashRelativePath: "dash/video-1",
		manifestFileName: "manifest.mpd",
		status: "pending",
		segmentCount: 0,
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		failureReason: null,
		transcriptRelativePath: null,
	};

	let service: JobsService;
	let ffmpegDashService: FfmpegDashService;
	let ffmpegAudioService: FfmpegAudioService;
	let transcriptionService: WhisperTranscriptionService;
	let videoRepository: VideoRepositoryService;
	let blobStorage: BlobStorageService;
	let processingHistory: ProcessingHistoryService;
	const callOrder: string[] = [];
	const existingFiles = new Set<string>();

	beforeEach(() => {
		vi.clearAllMocks();
		callOrder.length = 0;
		existingFiles.clear();
		ffmpegDashService = {
			generateDashAssets: vi.fn(async () => {
				callOrder.push("dash");
				return { segmentCount: 3 };
			}),
		} as unknown as FfmpegDashService;
		ffmpegAudioService = {
			extractAudio: vi.fn(async () => {
				callOrder.push("audio");
				return { audioRelativePath: "audio/video-1/track.mp3" };
			}),
		} as unknown as FfmpegAudioService;
		transcriptionService = {
			transcribe: vi.fn(async () => {
				callOrder.push("transcribe");
				return {
					transcriptRelativePath: "transcripts/video-1/transcript.json",
				};
			}),
		} as unknown as WhisperTranscriptionService;
		videoRepository = {
			listVideos: vi.fn(async () => [video]),
			updateVideo: vi.fn(async (_id, patch) => {
				if (patch.status === "processing") {
					callOrder.push("mark-processing");
				}
				if (patch.status === "ready") {
					callOrder.push("mark-ready");
				}
				return { ...video, ...patch };
			}),
		} as unknown as VideoRepositoryService;
		processingHistory = {
			recordStepStart: vi.fn(async () => undefined),
			recordStepComplete: vi.fn(async () => undefined),
			recordFailure: vi.fn(async () => undefined),
			markCompleted: vi.fn(async () => {
				callOrder.push("mark-completed");
			}),
		} as unknown as ProcessingHistoryService;
		blobStorage = {
			resolveRelativePath: vi.fn(
				(relativePath: string) => `/tmp/${relativePath}`,
			),
			getAudioRelativePath: vi.fn(() => "audio/video-1/track.mp3"),
			getTranscriptRelativePath: vi.fn(
				() => "transcripts/video-1/transcript.json",
			),
			fileExists: vi.fn(async (relativePath: string) =>
				existingFiles.has(relativePath),
			),
		} as unknown as BlobStorageService;

		service = new JobsService(
			{ info: vi.fn(), error: vi.fn() } as never,
			ffmpegDashService,
			ffmpegAudioService,
			transcriptionService,
			videoRepository,
			blobStorage,
			processingHistory,
		);
	});

	it("runs audio extraction, transcription, and DASH before marking ready", async () => {
		await service.processNextPendingVideo();

		expect(callOrder).toEqual([
			"mark-processing",
			"audio",
			"transcribe",
			"dash",
			"mark-completed",
			"mark-ready",
		]);
		expect(videoRepository.updateVideo).toHaveBeenCalledWith("video-1", {
			status: "ready",
			segmentCount: 3,
			transcriptRelativePath: "transcripts/video-1/transcript.json",
			failureReason: null,
		});
		expect(processingHistory.recordStepStart).toHaveBeenCalledTimes(3);
		expect(processingHistory.markCompleted).toHaveBeenCalledWith("video-1");
	});

	it("skips steps whose outputs already exist", async () => {
		existingFiles.add("audio/video-1/track.mp3");
		existingFiles.add("transcripts/video-1/transcript.json");

		await service.processNextPendingVideo();

		expect(callOrder).toEqual([
			"mark-processing",
			"dash",
			"mark-completed",
			"mark-ready",
		]);
		expect(ffmpegAudioService.extractAudio).not.toHaveBeenCalled();
		expect(transcriptionService.transcribe).not.toHaveBeenCalled();
		expect(processingHistory.recordStepComplete).toHaveBeenCalledWith(
			"video-1",
			"audio_extract",
			"skipped (already present)",
		);
	});
});
