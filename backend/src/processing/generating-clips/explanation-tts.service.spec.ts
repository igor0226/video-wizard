import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../../storage";
import { ExplanationTtsService } from "./explanation-tts.service";

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

describe("ExplanationTtsService", () => {
	let service: ExplanationTtsService;
	let blobStorage: BlobStorageService;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENAI_API_KEY = "test-key";
		speechCreate.mockResolvedValue({
			arrayBuffer: vi.fn(async () => Uint8Array.from([1, 2, 3]).buffer),
		});
		blobStorage = {
			writeUploadFile: vi.fn(async () => undefined),
			resolveRelativePath: vi.fn(
				(relativePath: string) => `/tmp/videos/${relativePath}`,
			),
		} as unknown as BlobStorageService;
		service = new ExplanationTtsService(
			{ info: vi.fn() } as never,
			blobStorage,
		);
	});

	it("writes mp3 output via blob storage and returns duration", async () => {
		const outputRelativePath =
			"explanations/video-1/clips/000.mp3";

		const result = await service.synthesizeSpeech({
			explanation: "An icebreaker helps people relax.",
			explanationLanguage: "English",
			outputRelativePath,
		});

		expect(result).toEqual({ durationSeconds: 4.2 });
		expect(blobStorage.writeUploadFile).toHaveBeenCalledWith(
			outputRelativePath,
			expect.any(Buffer),
		);
		expect(speechCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				model: "gpt-4o-mini-tts",
				voice: "coral",
				input: "An icebreaker helps people relax.",
			}),
		);
	});

	it("throws when OPENAI_API_KEY is missing", async () => {
		delete process.env.OPENAI_API_KEY;

		await expect(
			service.synthesizeSpeech({
				explanation: "Test",
				explanationLanguage: "English",
				outputRelativePath: "explanations/video-1/clips/000.mp3",
			}),
		).rejects.toThrow("OPENAI_API_KEY is required for explanation TTS");
	});
});
