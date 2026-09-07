import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	ProcessingHistoryService,
	ProcessingLockService,
	VideoRepositoryService,
} from "../storage";
import { makeTestVideoRecord } from "../../test/helpers/make-test-video-record";
import { FfmpegAudioService } from "./audio-extract/ffmpeg-audio.service";
import { PhraseDetectionService } from "./detecting-phrases/phrase-detection.service";
import { FfmpegDashService } from "./dash-encoding/ffmpeg-dash.service";
import { JobsService } from "./jobs.service";
import { ProcessingPipelineService } from "./processing-pipeline.service";
import { WhisperTranscriptionService } from "./transcribing/transcription.service";
import { BlobStorageService } from "../storage/blob-storage.service";

describe("JobsService", () => {
	const video = makeTestVideoRecord();

	let service: JobsService;
	let processingPipelineService: ProcessingPipelineService;
	let videoRepository: VideoRepositoryService;
	let processingLockService: ProcessingLockService;
	let processingHistory: ProcessingHistoryService;
	const callOrder: string[] = [];

	beforeEach(() => {
		vi.clearAllMocks();
		callOrder.length = 0;
		processingPipelineService = {
			runProcessingPipeline: vi.fn(async () => {
				callOrder.push("pipeline");
				return {
					audio: { audioRelativePath: "audio/video-1/track.mp3" },
					transcript: {
						transcriptRelativePath: "transcripts/video-1/transcript.json",
					},
					phrases: {
						phrasesRelativePath: "explanations/video-1/phrases.json",
					},
					clips: {
						clipsManifestRelativePath: "explanations/video-1/clips.json",
					},
					compose: { enrichedRelativePath: "enriched/video-1/output.mp4" },
					dash: { segmentCount: 3 },
				};
			}),
		} as unknown as ProcessingPipelineService;
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
		processingLockService = {
			tryAcquire: vi.fn(async () => true),
			release: vi.fn(async () => undefined),
		} as unknown as ProcessingLockService;

		service = new JobsService(
			{ info: vi.fn(), error: vi.fn() } as never,
			processingPipelineService,
			videoRepository,
			processingLockService,
			processingHistory,
		);
	});

	it("runs the processing pipeline before marking ready", async () => {
		await service.processNextPendingVideo();

		expect(callOrder).toEqual([
			"mark-processing",
			"pipeline",
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
		expect(
			processingPipelineService.runProcessingPipeline,
		).toHaveBeenCalledWith(video);
		expect(processingLockService.tryAcquire).toHaveBeenCalledWith("video-1");
		expect(processingLockService.release).toHaveBeenCalledWith("video-1");
	});
});

describe("ProcessingPipelineService", () => {
	const video = makeTestVideoRecord();

	let service: ProcessingPipelineService;
	let ffmpegDashService: FfmpegDashService;
	let ffmpegAudioService: FfmpegAudioService;
	let transcriptionService: WhisperTranscriptionService;
	let phraseDetectionService: PhraseDetectionService;
	let explanationClipService: {
		generateClips: ReturnType<typeof vi.fn>;
	};
	let ffmpegComposeService: {
		composeVideo: ReturnType<typeof vi.fn>;
	};
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
		explanationClipService = {
			generateClips: vi.fn(async () => {
				callOrder.push("clips");
				return {
					clipsManifestRelativePath: "explanations/video-1/clips.json",
				};
			}),
		};
		ffmpegComposeService = {
			composeVideo: vi.fn(async () => {
				callOrder.push("compose");
				return { enrichedRelativePath: "enriched/video-1/output.mp4" };
			}),
		};
		processingHistory = {
			recordStepStart: vi.fn(async () => undefined),
			recordStepComplete: vi.fn(async () => undefined),
		} as unknown as ProcessingHistoryService;
		blobStorage = {
			getAudioRelativePath: vi.fn(() => "audio/video-1/track.mp3"),
			getTranscriptRelativePath: vi.fn(
				() => "transcripts/video-1/transcript.json",
			),
			getPhrasesRelativePath: vi.fn(() => "explanations/video-1/phrases.json"),
			getClipsManifestRelativePath: vi.fn(
				() => "explanations/video-1/clips.json",
			),
			getEnrichedVideoRelativePath: vi.fn(() => "enriched/video-1/output.mp4"),
			fileExists: vi.fn(async (relativePath: string) =>
				existingFiles.has(relativePath),
			),
		} as unknown as BlobStorageService;

		service = new ProcessingPipelineService(
			{ info: vi.fn() } as never,
			ffmpegDashService,
			ffmpegAudioService,
			ffmpegComposeService as never,
			transcriptionService,
			phraseDetectionService,
			explanationClipService as never,
			blobStorage,
			processingHistory,
		);
	});

	it("runs all pipeline steps in order", async () => {
		await service.runProcessingPipeline(video);

		expect(callOrder).toEqual([
			"audio",
			"transcribe",
			"phrases",
			"clips",
			"compose",
			"dash",
		]);
		expect(processingHistory.recordStepStart).toHaveBeenCalledTimes(6);
	});

	it("skips steps whose outputs already exist", async () => {
		existingFiles.add("audio/video-1/track.mp3");
		existingFiles.add("transcripts/video-1/transcript.json");
		existingFiles.add("explanations/video-1/phrases.json");
		existingFiles.add("explanations/video-1/clips.json");
		existingFiles.add("enriched/video-1/output.mp4");

		await service.runProcessingPipeline(video);

		expect(callOrder).toEqual(["dash"]);
		expect(ffmpegAudioService.extractAudio).not.toHaveBeenCalled();
		expect(explanationClipService.generateClips).not.toHaveBeenCalled();
		expect(ffmpegComposeService.composeVideo).not.toHaveBeenCalled();
	});
});
