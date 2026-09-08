import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../../storage";
import type { MediaWorkspace } from "../shared/media-workspace.service";
import { MediaWorkspaceService } from "../shared/media-workspace.service";
import { makeTestVideoRecord } from "../../../test/helpers/make-test-video-record";
import { ExplanationClipService } from "./explanation-clip.service";
import { ExplanationTtsService } from "./explanation-tts.service";
import { runProcess } from "../shared/ffmpeg-process";
import { probeLoudnormStats } from "../shared/ffmpeg-loudness";

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
	const actual =
		await importOriginal<typeof import("../shared/ffmpeg-loudness")>();

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

const MULTI_PHRASE_TRANSCRIPT = {
	language: "english",
	duration: 20,
	text: "Hello world. Good morning.",
	words: [
		{ word: "Hello", start: 0, end: 0.4 },
		{ word: "world.", start: 0.4, end: 0.8 },
		{ word: "Good", start: 5, end: 5.3 },
		{ word: "morning.", start: 5.3, end: 5.7 },
	],
};

describe("ExplanationClipService", () => {
	const video = makeTestVideoRecord();

	let service: ExplanationClipService;
	let blobStorage: BlobStorageService;
	let explanationTtsService: ExplanationTtsService;
	let workspace: MediaWorkspace;
	let mediaWorkspace: MediaWorkspaceService;
	let workspaceDir: string;

	beforeEach(async () => {
		vi.clearAllMocks();
		delete process.env.CLIP_GENERATION_CONCURRENCY;
		workspaceDir = await mkdtemp(path.join(tmpdir(), "explanation-clip-spec-"));
		await mkdir(path.join(workspaceDir, "clips"), { recursive: true });
		vi.mocked(probeLoudnormStats).mockImplementation(async (absolutePath) => {
			if (absolutePath.includes("source.mp4")) {
				return SOURCE_LOUDNESS;
			}

			return TTS_LOUDNESS;
		});
		workspace = {
			dir: workspaceDir,
			download: vi.fn(async () => path.join(workspaceDir, "source/source.mp4")),
			localPath: vi.fn(async (relative: string) =>
				path.join(workspaceDir, relative),
			),
			upload: vi.fn(async () => undefined),
			uploadDir: vi.fn(async () => undefined),
			dispose: vi.fn(async () => undefined),
		} as unknown as MediaWorkspace;
		mediaWorkspace = {
			create: vi.fn(async () => workspace),
		} as unknown as MediaWorkspaceService;
		blobStorage = {
			ensureLayout: vi.fn(async () => undefined),
			getClipsDirectoryRelativePath: vi.fn(() => "explanations/video-1/clips"),
			getClipsManifestRelativePath: vi.fn(
				() => "explanations/video-1/clips.json",
			),
			ensureCleanDirectory: vi.fn(async () => undefined),
			fileExists: vi.fn(async () => true),
			listObjectKeys: vi.fn(async () => ["uploads/video-1/source.mp4"]),
			getUploadDirectoryRelativePath: vi.fn(() => "uploads/video-1"),
			readText: vi.fn(async (relativePath: string) => {
				if (relativePath.endsWith("phrases.json")) {
					return JSON.stringify({ phrases: [] });
				}
				return JSON.stringify(MULTI_PHRASE_TRANSCRIPT);
			}),
			writeJson: vi.fn(async () => undefined),
		} as unknown as BlobStorageService;
		explanationTtsService = {
			synthesizeSpeech: vi.fn(async () => ({ durationSeconds: 3 })),
			resolveClosingAudio: vi.fn(async () => ({
				absolutePath: "/tmp/assets/listen-again/english.mp3",
				durationSeconds: 1.2,
			})),
		} as unknown as ExplanationTtsService;
		service = new ExplanationClipService(
			{ info: vi.fn() } as never,
			blobStorage,
			explanationTtsService,
			mediaWorkspace,
		);
	});

	afterEach(async () => {
		await rm(workspaceDir, { recursive: true, force: true });
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
		expect(explanationTtsService.resolveClosingAudio).not.toHaveBeenCalled();
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

			return JSON.stringify(MULTI_PHRASE_TRANSCRIPT);
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
						durationSeconds: 5.5,
					}),
				],
			},
		);
		expect(explanationTtsService.synthesizeSpeech).toHaveBeenCalledWith(
			expect.objectContaining({
				explanation: "A greeting.",
				outputRelativePath: "explanations/video-1/clips/000.speech.mp3",
			}),
		);
		expect(explanationTtsService.resolveClosingAudio).toHaveBeenCalledTimes(1);
		expect(explanationTtsService.resolveClosingAudio).toHaveBeenCalledWith({
			explanationLanguage: "English",
			workspace,
		});
		expect(probeLoudnormStats).toHaveBeenCalledTimes(2);
		expect(probeLoudnormStats).toHaveBeenCalledWith(
			path.join(workspaceDir, "source/source.mp4"),
		);
		expect(probeLoudnormStats).toHaveBeenCalledWith(
			path.join(workspaceDir, "clips/000.mp3"),
		);
		expect(vi.mocked(runProcess).mock.calls).toHaveLength(2);
		const concatArgs = vi.mocked(runProcess).mock.calls[0]?.[1] ?? [];
		expect(concatArgs.join(" ")).toContain("concat=n=2:v=0:a=1");
		const ffmpegArgs = vi.mocked(runProcess).mock.calls[1]?.[1] ?? [];
		const filterIndex = ffmpegArgs.indexOf("-filter:a");
		const audioFilter = ffmpegArgs[filterIndex + 1];

		expect(audioFilter).toContain("loudnorm=I=-18.2");
		expect(audioFilter).toContain("adelay=500|500,apad=pad_dur=0.5");
		expect(ffmpegArgs.includes("-shortest")).toBe(false);
	});

	it("renders multiple clips in parallel and writes a sorted manifest", async () => {
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
						{
							phrase: "Good morning",
							startWordIndex: 2,
							endWordIndex: 3,
							explanation: "A morning greeting.",
							difficulty: "easy",
						},
					],
				});
			}

			return JSON.stringify(MULTI_PHRASE_TRANSCRIPT);
		});

		await service.generateClips({
			video,
			phrasesRelativePath: "explanations/video-1/phrases.json",
			transcriptRelativePath: "transcripts/video-1/transcript.json",
		});

		expect(explanationTtsService.resolveClosingAudio).toHaveBeenCalledTimes(1);
		expect(explanationTtsService.synthesizeSpeech).toHaveBeenCalledTimes(2);
		expect(workspace.uploadDir).toHaveBeenCalledWith({
			localDir: path.join(workspaceDir, "clips"),
			prefix: "explanations/video-1/clips",
		});
		expect(blobStorage.writeJson).toHaveBeenCalledWith(
			"explanations/video-1/clips.json",
			{
				clips: [
					expect.objectContaining({ index: 0, phrase: "Hello world" }),
					expect.objectContaining({ index: 1, phrase: "Good morning" }),
				],
			},
		);
	});
});
