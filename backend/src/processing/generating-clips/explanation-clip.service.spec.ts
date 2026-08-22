import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../../storage";
import { makeTestVideoRecord } from "../../../test/helpers/make-test-video-record";
import { ExplanationClipService } from "./explanation-clip.service";
import { ExplanationTtsService } from "./explanation-tts.service";
import { runProcess } from "../shared/ffmpeg-process";
import { probeLoudnormStats } from "../shared/ffmpeg-loudness";

vi.mock("node:fs/promises", () => ({
	writeFile: vi.fn(async () => undefined),
}));

vi.mock("../shared/ffmpeg-probe", () => ({
	probeVideoFile: vi.fn(async () => ({
		width: 1280,
		height: 720,
		fps: 30,
		audioSampleRate: 48_000,
		audioChannels: 2,
	})),
}));

vi.mock("../shared/ffmpeg-loudness", async (importOriginal) => {
	const actual = await importOriginal<
		typeof import("../shared/ffmpeg-loudness")
	>();

	return {
		...actual,
		probeLoudnormStats: vi.fn(),
	};
});

vi.mock("../shared/ffmpeg-process", () => ({
	runProcess: vi.fn(async () => undefined),
	normalizeFfmpegError: vi.fn((error: unknown) => error),
}));

const SOURCE_LOUDNESS = {
	input_i: -18.2,
	input_tp: -2.1,
	input_lra: 6.5,
	input_thresh: -28.4,
	target_offset: 1.3,
};

const TTS_LOUDNESS = {
	input_i: -30.5,
	input_tp: -8.2,
	input_lra: 4.1,
	input_thresh: -40.3,
	target_offset: 12.5,
};

describe("ExplanationClipService", () => {
	const video = makeTestVideoRecord();

	let service: ExplanationClipService;
	let blobStorage: BlobStorageService;
	let explanationTtsService: ExplanationTtsService;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(probeLoudnormStats).mockImplementation(async (absolutePath) => {
			if (absolutePath.includes("/uploads/")) {
				return SOURCE_LOUDNESS;
			}

			return TTS_LOUDNESS;
		});
		blobStorage = {
			ensureLayout: vi.fn(async () => undefined),
			getClipsDirectoryRelativePath: vi.fn(() => "explanations/video-1/clips"),
			getClipsManifestRelativePath: vi.fn(
				() => "explanations/video-1/clips.json",
			),
			ensureCleanDirectory: vi.fn(
				async () => "/tmp/explanations/video-1/clips",
			),
			readText: vi.fn(async (relativePath: string) => {
				if (relativePath.endsWith("phrases.json")) {
					return JSON.stringify({ phrases: [] });
				}
				return JSON.stringify({
					language: "english",
					duration: 10,
					text: "Hello world.",
					words: [{ word: "Hello", start: 0, end: 0.4 }],
				});
			}),
			writeJson: vi.fn(async () => undefined),
			getStoragePathsForVideo: vi.fn(() => ({
				sourceAbsolutePath: "/tmp/uploads/video-1/source.mp4",
				dashAbsolutePath: "/tmp/dash/video-1",
				manifestAbsolutePath: "/tmp/dash/video-1/manifest.mpd",
			})),
			resolveRelativePath: vi.fn(
				(relativePath: string) => `/tmp/${relativePath}`,
			),
		} as unknown as BlobStorageService;
		explanationTtsService = {
			synthesizeSpeech: vi.fn(async () => ({ durationSeconds: 3 })),
		} as unknown as ExplanationTtsService;
		service = new ExplanationClipService(
			{ info: vi.fn() } as never,
			blobStorage,
			explanationTtsService,
		);
	});

	it("writes an empty clips manifest when no phrases were detected", async () => {
		const result = await service.generateClips({
			video,
			phrasesRelativePath: "explanations/video-1/phrases.json",
			transcriptRelativePath: "transcripts/video-1/transcript.json",
		});

		expect(result).toEqual({
			clipsManifestRelativePath: "explanations/video-1/clips.json",
		});
		expect(blobStorage.writeJson).toHaveBeenCalledWith(
			"explanations/video-1/clips.json",
			{ clips: [] },
		);
		expect(explanationTtsService.synthesizeSpeech).not.toHaveBeenCalled();
	});

	it("renders clips with loudness matched to the source video", async () => {
		vi.mocked(blobStorage.readText).mockImplementation(async (relativePath) => {
			if (relativePath.endsWith("phrases.json")) {
				return JSON.stringify({
					phrases: [
						{
							phrase: "Hello world",
							startWordIndex: 0,
							endWordIndex: 1,
							explanation: "A greeting.",
							difficulty: "easy",
						},
					],
				});
			}

			return JSON.stringify({
				language: "english",
				duration: 10,
				text: "Hello world.",
				words: [
					{ word: "Hello", start: 0, end: 0.4 },
					{ word: "world.", start: 0.4, end: 0.8 },
				],
			});
		});

		await service.generateClips({
			video,
			phrasesRelativePath: "explanations/video-1/phrases.json",
			transcriptRelativePath: "transcripts/video-1/transcript.json",
		});

		expect(blobStorage.writeJson).toHaveBeenCalledWith(
			"explanations/video-1/clips.json",
			{
				clips: [
					expect.objectContaining({
						phrase: "Hello world",
						insertAtSeconds: 0.8,
						sentenceStartSeconds: 0,
						durationSeconds: 4,
					}),
				],
			},
		);
		expect(explanationTtsService.synthesizeSpeech).toHaveBeenCalledWith(
			expect.objectContaining({
				explanation: "A greeting. Let's listen once again!",
			}),
		);
		expect(probeLoudnormStats).toHaveBeenCalledTimes(2);
		expect(probeLoudnormStats).toHaveBeenCalledWith(
			"/tmp/uploads/video-1/source.mp4",
		);
		expect(probeLoudnormStats).toHaveBeenCalledWith(
			"/tmp/explanations/video-1/clips/000.mp3",
		);
		const ffmpegArgs = vi.mocked(runProcess).mock.calls[0]?.[1] ?? [];
		const filterIndex = ffmpegArgs.indexOf("-filter:a");
		const audioFilter = ffmpegArgs[filterIndex + 1];

		expect(audioFilter).toContain("loudnorm=I=-18.2");
		expect(audioFilter).toContain("adelay=500|500,apad=pad_dur=0.5");
		expect(ffmpegArgs.includes("-shortest")).toBe(false);
	});
});
