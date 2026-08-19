import { createReadStream } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../../storage";
import { makeTestVideoRecord } from "../../../test/helpers/make-test-video-record";
import type { ExtractAudioResult } from "../audio-extract/ffmpeg-audio.service";
import { WhisperTranscriptionService } from "./transcription.service";

const createMock = vi.fn();

vi.mock("openai", () => ({
	default: vi.fn().mockImplementation(() => ({
		audio: {
			transcriptions: {
				create: createMock,
			},
		},
	})),
}));

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	return {
		...actual,
		createReadStream: vi.fn(() => "mock-stream"),
	};
});

describe("WhisperTranscriptionService", () => {
	const video = makeTestVideoRecord({ status: "processing" });
	const audioResult: ExtractAudioResult = {
		audioRelativePath: "audio/video-1/track.mp3",
	};

	let blobStorage: BlobStorageService;
	let service: WhisperTranscriptionService;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENAI_API_KEY = "test-key";
		blobStorage = {
			resolveRelativePath: vi.fn(
				(relativePath: string) => `/tmp/${relativePath}`,
			),
			getFileSizeBytes: vi.fn(async () => 1024),
			getTranscriptRelativePath: vi.fn(
				() => "transcripts/video-1/transcript.json",
			),
			writeJson: vi.fn(async () => undefined),
		} as unknown as BlobStorageService;
		service = new WhisperTranscriptionService(
			{ info: vi.fn() } as never,
			blobStorage,
		);
	});

	it("calls whisper-1 with verbose_json and word timestamps", async () => {
		createMock.mockResolvedValue({
			task: "transcribe",
			language: "english",
			duration: 2,
			text: "hello",
			words: [{ word: "hello", start: 0, end: 0.5 }],
		});

		const result = await service.transcribe({ video, audioResult });

		expect(createReadStream).toHaveBeenCalledWith(
			"/tmp/audio/video-1/track.mp3",
		);
		expect(createMock).toHaveBeenCalledWith({
			file: "mock-stream",
			model: "whisper-1",
			response_format: "verbose_json",
			timestamp_granularities: ["word", "segment"],
		});
		expect(blobStorage.writeJson).toHaveBeenCalledWith(
			"transcripts/video-1/transcript.json",
			expect.objectContaining({
				text: "hello",
				words: [{ word: "hello", start: 0, end: 0.5 }],
			}),
		);
		expect(result.transcriptRelativePath).toBe(
			"transcripts/video-1/transcript.json",
		);
	});

	it("fails fast when OPENAI_API_KEY is missing", async () => {
		delete process.env.OPENAI_API_KEY;

		await expect(service.transcribe({ video, audioResult })).rejects.toThrow(
			"OPENAI_API_KEY is required for transcription",
		);
	});
});
