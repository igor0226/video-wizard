import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../../storage";
import { makeTestVideoRecord } from "../../../test/helpers/make-test-video-record";
import { ExplanationClipService } from "./explanation-clip.service";
import { ExplanationTtsService } from "./explanation-tts.service";
import { runProcess } from "../shared/ffmpeg-process";

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

vi.mock("../shared/ffmpeg-process", () => ({
	runProcess: vi.fn(async () => undefined),
	normalizeFfmpegError: vi.fn((error: unknown) => error),
}));

describe("ExplanationClipService", () => {
	const video = makeTestVideoRecord();

	let service: ExplanationClipService;
	let blobStorage: BlobStorageService;
	let explanationTtsService: ExplanationTtsService;

	beforeEach(() => {
		vi.clearAllMocks();
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

	it("renders clips with 500ms gaps and padded duration", async () => {
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
						durationSeconds: 4,
					}),
				],
			},
		);
		expect(runProcess).toHaveBeenCalledWith(
			"ffmpeg",
			expect.arrayContaining([
				"-t",
				"4",
				"-filter:a",
				"adelay=500|500,apad=pad_dur=0.5",
			]),
		);
		expect(
			vi.mocked(runProcess).mock.calls[0]?.[1]?.includes("-shortest"),
		).toBe(false);
	});
});
