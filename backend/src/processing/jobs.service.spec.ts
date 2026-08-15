import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	BlobStorageService,
	ProcessingHistoryService,
	VideoRepositoryService,
} from "../storage";
import { makeTestVideoRecord } from "../../test/helpers/make-test-video-record";
import { FfmpegAudioService } from "./ffmpeg-audio.service";
import { FfmpegDashService } from "./ffmpeg-dash.service";
import { JobsService } from "./jobs.service";
import { PhraseDetectionService } from "./phrase-detection.service";
import { WhisperTranscriptionService } from "./transcription.service";

vi.mock("node:fs/promises", () => ({
	open: vi.fn(async () => ({
		close: vi.fn(async () => undefined),
	})),
	mkdir: vi.fn(async () => undefined),
	rm: vi.fn(async () => undefined),
}));

describe("JobsService", () => {
	const video = makeTestVideoRecord();

	let service: JobsService;
	let ffmpegDashService: FfmpegDashService;
	let ffmpegAudioService: FfmpegAudioService;
	let transcriptionService: WhisperTranscriptionService;
	let phraseDetectionService: PhraseDetectionService;
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
		phraseDetectionService = {
			detectPhrases: vi.fn(async () => {
				callOrder.push("phrases");
				return {
					phrasesRelativePath: "explanations/video-1/phrases.json",
				};
			}),
		} as unknown as PhraseDetectionService;
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
			getPhrasesRelativePath: vi.fn(() => "explanations/video-1/phrases.json"),
			fileExists: vi.fn(async (relativePath: string) =>
				existingFiles.has(relativePath),
			),
		} as unknown as BlobStorageService;

		service = new JobsService(
			{ info: vi.fn(), error: vi.fn() } as never,
			ffmpegDashService,
			ffmpegAudioService,
			transcriptionService,
			phraseDetectionService,
			videoRepository,
			blobStorage,
			processingHistory,
		);
	});

	it("runs audio extraction, transcription, phrase detection, and DASH before marking ready", async () => {
		await service.processNextPendingVideo();

		expect(callOrder).toEqual([
			"mark-processing",
			"audio",
			"transcribe",
			"phrases",
			"dash",
			"mark-completed",
			"mark-ready",
		]);
		expect(videoRepository.updateVideo).toHaveBeenCalledWith("video-1", {
			status: "ready",
			segmentCount: 3,
			transcriptRelativePath: "transcripts/video-1/transcript.json",
			phrasesRelativePath: "explanations/video-1/phrases.json",
			failureReason: null,
		});
		expect(processingHistory.recordStepStart).toHaveBeenCalledTimes(4);
		expect(processingHistory.markCompleted).toHaveBeenCalledWith("video-1");
	});

	it("skips steps whose outputs already exist", async () => {
		existingFiles.add("audio/video-1/track.mp3");
		existingFiles.add("transcripts/video-1/transcript.json");
		existingFiles.add("explanations/video-1/phrases.json");

		await service.processNextPendingVideo();

		expect(callOrder).toEqual([
			"mark-processing",
			"dash",
			"mark-completed",
			"mark-ready",
		]);
		expect(ffmpegAudioService.extractAudio).not.toHaveBeenCalled();
		expect(transcriptionService.transcribe).not.toHaveBeenCalled();
		expect(phraseDetectionService.detectPhrases).not.toHaveBeenCalled();
		expect(processingHistory.recordStepComplete).toHaveBeenCalledWith({
			videoId: "video-1",
			step: "audio_extract",
			message: "skipped (already present)",
		});
	});
});
