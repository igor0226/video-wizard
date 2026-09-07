import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../../storage";
import type { MediaWorkspace } from "../shared/media-workspace.service";
import { MediaWorkspaceService } from "../shared/media-workspace.service";
import {
	buildExplanationSpeechText,
	ExplanationTtsService,
} from "./explanation-tts.service";

const speechCreate = vi.fn();

vi.mock("openai", () => ({
	default: vi.fn().mockImplementation(() => ({
		audio: {
			speech: {
				create: speechCreate,
			},
		},
	})),
}));

vi.mock("../shared/ffmpeg-probe", () => ({
	probeAudioDurationSeconds: vi.fn(async () => 4.2),
}));

describe("buildExplanationSpeechText", () => {
	it("joins phrase and explanation with a period", () => {
		expect(
			buildExplanationSpeechText({
				phrase: "icebreaker",
				explanation: "An icebreaker helps people relax.",
			}),
		).toBe("icebreaker. An icebreaker helps people relax.");
	});

	it("does not add a period when the phrase already ends with punctuation", () => {
		expect(
			buildExplanationSpeechText({
				phrase: "icebreaker!",
				explanation: "An icebreaker helps people relax.",
			}),
		).toBe("icebreaker! An icebreaker helps people relax.");
	});
});

describe("ExplanationTtsService", () => {
	let service: ExplanationTtsService;
	let blobStorage: BlobStorageService;
	let workspace: MediaWorkspace;
	let mediaWorkspace: MediaWorkspaceService;

	beforeEach(async () => {
		vi.clearAllMocks();
		process.env.OPENAI_API_KEY = "test-key";
		await rm("/tmp/workspace", { recursive: true, force: true });
		speechCreate.mockResolvedValue({
			arrayBuffer: vi.fn(async () => Uint8Array.from([1, 2, 3]).buffer),
		});
		workspace = {
			dir: "/tmp/workspace",
			localPath: vi.fn(async (relative: string) => {
				const absolutePath = path.join("/tmp/workspace", relative);
				await mkdir(path.dirname(absolutePath), { recursive: true });
				return absolutePath;
			}),
			upload: vi.fn(async () => undefined),
			download: vi.fn(async () => "/tmp/workspace/english.mp3"),
			dispose: vi.fn(async () => undefined),
		} as unknown as MediaWorkspace;
		mediaWorkspace = {
			create: vi.fn(async () => workspace),
		} as unknown as MediaWorkspaceService;
		blobStorage = {
			getListenAgainAssetRelativePath: vi.fn(
				(language: string) => `assets/listen-again/${language}.mp3`,
			),
			fileExists: vi.fn(async () => false),
		} as unknown as BlobStorageService;
		service = new ExplanationTtsService(
			{ info: vi.fn() } as never,
			blobStorage,
			mediaWorkspace,
		);
	});

	it("writes mp3 output via blob storage and returns duration", async () => {
		const outputRelativePath = "explanations/video-1/clips/000.mp3";

		const result = await service.synthesizeSpeech({
			phrase: "icebreaker",
			explanation: "An icebreaker helps people relax.",
			explanationLanguage: "English",
			outputRelativePath,
		});

		expect(result).toEqual({ durationSeconds: 4.2 });
		expect(workspace.upload).toHaveBeenCalledWith({
			localPath: "/tmp/workspace/000.mp3",
			key: outputRelativePath,
		});
		expect(speechCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				model: "gpt-4o-mini-tts",
				voice: "coral",
				input: "icebreaker. An icebreaker helps people relax.",
			}),
		);
	});

	it("throws when OPENAI_API_KEY is missing", async () => {
		delete process.env.OPENAI_API_KEY;

		await expect(
			service.synthesizeSpeech({
				phrase: "Test",
				explanation: "Test",
				explanationLanguage: "English",
				outputRelativePath: "explanations/video-1/clips/000.mp3",
			}),
		).rejects.toThrow("OPENAI_API_KEY is required for explanation TTS");
	});

	it("synthesizes closing audio when the cached asset is missing", async () => {
		const result = await service.resolveClosingAudio({
			explanationLanguage: "English",
			workspace,
		});

		expect(result).toEqual({
			absolutePath: "/tmp/workspace/english.mp3",
			durationSeconds: 4.2,
		});
		expect(blobStorage.fileExists).toHaveBeenCalledWith(
			"assets/listen-again/english.mp3",
		);
		expect(speechCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				input: "Let's listen once again!",
			}),
		);
		expect(workspace.upload).toHaveBeenCalledWith({
			localPath: "/tmp/workspace/english.mp3",
			key: "assets/listen-again/english.mp3",
		});
	});

	it("reuses cached closing audio without synthesizing again", async () => {
		vi.mocked(blobStorage.fileExists).mockResolvedValue(true);

		const result = await service.resolveClosingAudio({
			explanationLanguage: "English",
			workspace,
		});

		expect(result).toEqual({
			absolutePath: "/tmp/workspace/english.mp3",
			durationSeconds: 4.2,
		});
		expect(speechCreate).not.toHaveBeenCalled();
		expect(workspace.upload).not.toHaveBeenCalled();
	});
});
