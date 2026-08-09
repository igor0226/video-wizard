import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService, VideoRepositoryService } from "../storage";
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
	const callOrder: string[] = [];

	beforeEach(() => {
		vi.clearAllMocks();
		callOrder.length = 0;
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
				return { transcriptRelativePath: "transcripts/video-1/transcript.json" };
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
		blobStorage = {
			resolveRelativePath: vi.fn(
				(relativePath: string) => `/tmp/${relativePath}`,
			),
		} as unknown as BlobStorageService;

		service = new JobsService(
			{ info: vi.fn(), error: vi.fn() } as never,
			ffmpegDashService,
			ffmpegAudioService,
			transcriptionService,
			videoRepository,
			blobStorage,
		);
	});

	it("runs DASH, audio extraction, and transcription before marking ready", async () => {
		await service.processNextPendingVideo();

		expect(callOrder).toEqual([
			"mark-processing",
			"dash",
			"audio",
			"transcribe",
			"mark-ready",
		]);
		expect(videoRepository.updateVideo).toHaveBeenCalledWith("video-1", {
			status: "ready",
			segmentCount: 3,
			transcriptRelativePath: "transcripts/video-1/transcript.json",
			failureReason: null,
		});
	});
});
