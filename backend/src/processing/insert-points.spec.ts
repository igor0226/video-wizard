import { describe, expect, it } from "vitest";

import {
	buildPhraseInsertPoints,
	resolveInsertAtSeconds,
} from "./insert-points";
import type { DetectedPhrase } from "./phrase-detection.service";
import type { WhisperTranscript } from "./merge-transcripts";

function makePhrase(overrides: Partial<DetectedPhrase> = {}): DetectedPhrase {
	return {
		phrase: "test phrase",
		startWordIndex: 0,
		endWordIndex: 1,
		explanation: "An explanation.",
		difficulty: "easy",
		...overrides,
	};
}

describe("resolveInsertAtSeconds", () => {
	it("uses Whisper segment end when the phrase word is inside a segment", () => {
		const transcript: WhisperTranscript = {
			language: "english",
			duration: 10,
			text: "Hello world again",
			words: [
				{ word: "Hello", start: 0, end: 0.4 },
				{ word: "world", start: 0.4, end: 0.8 },
				{ word: "again", start: 5, end: 5.4 },
			],
			segments: [
				{ start: 0, end: 2.5, text: "Hello world." },
				{ start: 5, end: 6.2, text: "Again." },
			],
		};

		expect(resolveInsertAtSeconds(transcript, 1)).toBe(2.5);
	});

	it("falls back to punctuation when segments are missing", () => {
		const transcript: WhisperTranscript = {
			language: "english",
			duration: 5,
			text: "Hello world again",
			words: [
				{ word: "Hello", start: 0, end: 0.4 },
				{ word: "world.", start: 0.4, end: 0.8 },
				{ word: "again", start: 1.2, end: 1.6 },
			],
		};

		expect(resolveInsertAtSeconds(transcript, 1)).toBe(0.8);
	});

	it("falls back to a word gap when no punctuation is present", () => {
		const transcript: WhisperTranscript = {
			language: "english",
			duration: 10,
			text: "Hello world again",
			words: [
				{ word: "Hello", start: 0, end: 0.4 },
				{ word: "world", start: 0.4, end: 0.8 },
				{ word: "again", start: 2, end: 2.4 },
			],
		};

		expect(resolveInsertAtSeconds(transcript, 1)).toBe(0.8);
	});
});

describe("buildPhraseInsertPoints", () => {
	it("groups multiple phrases on the same sentence end timestamp", () => {
		const transcript: WhisperTranscript = {
			language: "english",
			duration: 10,
			text: "Hello world again now",
			words: [
				{ word: "Hello", start: 0, end: 0.4 },
				{ word: "world", start: 0.4, end: 0.8 },
				{ word: "again", start: 0.8, end: 1.1 },
				{ word: "now", start: 1.1, end: 1.4 },
			],
			segments: [{ start: 0, end: 2.5, text: "Hello world again now." }],
		};

		const points = buildPhraseInsertPoints(
			[
				makePhrase({ endWordIndex: 1, phrase: "Hello world" }),
				makePhrase({ endWordIndex: 3, phrase: "again now" }),
			],
			transcript,
		);

		expect(points).toEqual([
			{
				index: 0,
				phrase: expect.objectContaining({ phrase: "Hello world" }),
				insertAtSeconds: 2.5,
			},
			{
				index: 1,
				phrase: expect.objectContaining({ phrase: "again now" }),
				insertAtSeconds: 2.5,
			},
		]);
	});
});
