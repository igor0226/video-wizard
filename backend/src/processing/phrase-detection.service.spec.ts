import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../storage";
import { makeTestVideoRecord } from "../../test/helpers/make-test-video-record";
import { PhraseDetectionService } from "./phrase-detection.service";

const parseMock = vi.fn();

vi.mock("openai", () => ({
	default: vi.fn().mockImplementation(() => ({
		responses: {
			parse: parseMock,
		},
	})),
}));

function makeParsedResponse(phrases: unknown[]) {
	return {
		output: [
			{
				type: "message",
				content: [
					{
						type: "output_text",
						parsed: { phrases },
					},
				],
			},
		],
	};
}

describe("PhraseDetectionService", () => {
	const video = makeTestVideoRecord({
		status: "processing",
		sourceLanguage: "Spanish",
		explanationLanguage: "English",
		languageLevel: "A2",
	});

	let blobStorage: BlobStorageService;
	let service: PhraseDetectionService;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OPENAI_API_KEY = "test-key";
		blobStorage = {
			readText: vi.fn(async () =>
				JSON.stringify({
					language: "spanish",
					duration: 2,
					text: "no way hombre",
					words: [
						{ word: "no", start: 0, end: 0.2 },
						{ word: "way", start: 0.2, end: 0.5 },
						{ word: "hombre", start: 0.5, end: 1 },
					],
				}),
			),
			getPhrasesRelativePath: vi.fn(() => "explanations/video-1/phrases.json"),
			writeJson: vi.fn(async () => undefined),
		} as unknown as BlobStorageService;
		service = new PhraseDetectionService(
			{ info: vi.fn() } as never,
			blobStorage,
		);
	});

	it("calls gpt-5.6-luna with language context and writes phrases.json", async () => {
		parseMock.mockResolvedValue(
			makeParsedResponse([
				{
					phrase: "no way",
					startWordIndex: 0,
					endWordIndex: 1,
					explanation: "An informal expression of surprise.",
					difficulty: "hard",
				},
			]),
		);

		const result = await service.detectPhrases({
			video,
			transcriptRelativePath: "transcripts/video-1/transcript.json",
		});

		expect(parseMock).toHaveBeenCalledWith(
			expect.objectContaining({
				model: "gpt-5.6-luna",
				input: expect.arrayContaining([
					expect.objectContaining({ role: "system" }),
					expect.objectContaining({
						role: "user",
						content: expect.stringContaining("Source language: Spanish"),
					}),
				]),
			}),
		);
		expect(parseMock.mock.calls[0][0].input[1].content).toContain(
			"Explanation language: English",
		);
		expect(parseMock.mock.calls[0][0].input[1].content).toContain(
			"Learner CEFR level: A2",
		);
		expect(blobStorage.writeJson).toHaveBeenCalledWith(
			"explanations/video-1/phrases.json",
			{
				phrases: [
					expect.objectContaining({
						phrase: "no way",
						startWordIndex: 0,
						endWordIndex: 1,
					}),
				],
			},
		);
		expect(result.phrasesRelativePath).toBe(
			"explanations/video-1/phrases.json",
		);
	});

	it("drops phrases with invalid word indexes", async () => {
		parseMock.mockResolvedValue(
			makeParsedResponse([
				{
					phrase: "valid",
					startWordIndex: 0,
					endWordIndex: 0,
					explanation: "ok",
					difficulty: "easy",
				},
				{
					phrase: "invalid",
					startWordIndex: 5,
					endWordIndex: 6,
					explanation: "bad",
					difficulty: "hard",
				},
			]),
		);

		await service.detectPhrases({
			video,
			transcriptRelativePath: "transcripts/video-1/transcript.json",
		});

		expect(blobStorage.writeJson).toHaveBeenCalledWith(
			"explanations/video-1/phrases.json",
			{
				phrases: [expect.objectContaining({ phrase: "valid" })],
			},
		);
	});

	it("fails fast when OPENAI_API_KEY is missing", async () => {
		delete process.env.OPENAI_API_KEY;

		await expect(
			service.detectPhrases({
				video,
				transcriptRelativePath: "transcripts/video-1/transcript.json",
			}),
		).rejects.toThrow("OPENAI_API_KEY is required for phrase detection");
	});
});
