import { describe, expect, it } from "vitest";

import { mergeWhisperTranscripts } from "./merge-transcripts";
import type { WhisperTranscript } from "./merge-transcripts";

describe("mergeWhisperTranscripts", () => {
	it("merges chunk text and offsets word timestamps", () => {
		const first: WhisperTranscript = {
			language: "english",
			duration: 5,
			text: "Hello world",
			words: [
				{ word: "Hello", start: 0, end: 0.4 },
				{ word: "world", start: 0.4, end: 0.9 },
			],
		};
		const second: WhisperTranscript = {
			language: "english",
			duration: 4,
			text: "again now",
			words: [
				{ word: "again", start: 0.1, end: 0.5 },
				{ word: "now", start: 0.5, end: 0.8 },
			],
		};

		const merged = mergeWhisperTranscripts([first, second], [0, 600]);

		expect(merged.language).toBe("english");
		expect(merged.text).toBe("Hello world again now");
		expect(merged.duration).toBe(604);
		expect(merged.words).toEqual([
			{ word: "Hello", start: 0, end: 0.4 },
			{ word: "world", start: 0.4, end: 0.9 },
			{ word: "again", start: 600.1, end: 600.5 },
			{ word: "now", start: 600.5, end: 600.8 },
		]);
	});

	it("throws when no chunks are provided", () => {
		expect(() => mergeWhisperTranscripts([], [])).toThrow(
			"Cannot merge empty transcript chunks",
		);
	});

	it("merges segment timestamps with offsets", () => {
		const first: WhisperTranscript = {
			language: "english",
			duration: 5,
			text: "Hello world.",
			words: [{ word: "Hello", start: 0, end: 0.4 }],
			segments: [{ start: 0, end: 2.5, text: "Hello world." }],
		};
		const second: WhisperTranscript = {
			language: "english",
			duration: 4,
			text: "Again.",
			words: [{ word: "Again", start: 0.1, end: 0.5 }],
			segments: [{ start: 0, end: 1.2, text: "Again." }],
		};

		const merged = mergeWhisperTranscripts([first, second], [0, 600]);

		expect(merged.segments).toEqual([
			{ start: 0, end: 2.5, text: "Hello world." },
			{ start: 600, end: 601.2, text: "Again." },
		]);
	});
});
