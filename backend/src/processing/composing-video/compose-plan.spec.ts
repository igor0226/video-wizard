import { describe, expect, it } from "vitest";

import {
	buildCompositionParts,
	buildExplanationsByIndex,
	buildPlaybackPhrases,
} from "./compose-plan";
import type { ExplanationClipManifestEntry } from "../generating-clips/explanation-clip.service";

function makeClip(
	overrides: Partial<ExplanationClipManifestEntry> &
		Pick<
			ExplanationClipManifestEntry,
			"index" | "phrase" | "insertAtSeconds" | "durationSeconds" | "relativePath"
		>,
): ExplanationClipManifestEntry {
	return {
		sentenceStartSeconds: overrides.insertAtSeconds,
		...overrides,
	};
}

describe("buildCompositionParts", () => {
	it("returns a single source part when there are no clips", () => {
		expect(buildCompositionParts([], 120)).toEqual([
			{ kind: "source", startSeconds: 0, endSeconds: 120 },
		]);
	});

	it("inserts clips after source segments at each insert time", () => {
		const clips: ExplanationClipManifestEntry[] = [
			makeClip({
				index: 0,
				phrase: "first",
				insertAtSeconds: 10,
				sentenceStartSeconds: 7,
				durationSeconds: 3,
				relativePath: "explanations/video-1/clips/000.mp4",
			}),
			makeClip({
				index: 1,
				phrase: "second",
				insertAtSeconds: 20,
				sentenceStartSeconds: 18,
				durationSeconds: 4,
				relativePath: "explanations/video-1/clips/001.mp4",
			}),
		];

		expect(buildCompositionParts(clips, 60)).toEqual([
			{ kind: "source", startSeconds: 0, endSeconds: 10 },
			{ kind: "clip", clip: clips[0] },
			{ kind: "source", startSeconds: 7, endSeconds: 20 },
			{ kind: "clip", clip: clips[1] },
			{ kind: "source", startSeconds: 18, endSeconds: 60 },
		]);
	});

	it("keeps clips at the same insert time adjacent in phrase order", () => {
		const clips: ExplanationClipManifestEntry[] = [
			makeClip({
				index: 1,
				phrase: "second phrase",
				insertAtSeconds: 12,
				sentenceStartSeconds: 9,
				durationSeconds: 3,
				relativePath: "explanations/video-1/clips/001.mp4",
			}),
			makeClip({
				index: 0,
				phrase: "first phrase",
				insertAtSeconds: 12,
				sentenceStartSeconds: 8,
				durationSeconds: 3,
				relativePath: "explanations/video-1/clips/000.mp4",
			}),
		];

		const parts = buildCompositionParts(clips, 30);
		expect(parts).toEqual([
			{ kind: "source", startSeconds: 0, endSeconds: 12 },
			{ kind: "clip", clip: clips[1] },
			{ kind: "clip", clip: clips[0] },
			{ kind: "source", startSeconds: 8, endSeconds: 30 },
		]);
	});

	it("does not rewind when sentenceStart is at or after insertAt", () => {
		const clips: ExplanationClipManifestEntry[] = [
			makeClip({
				index: 0,
				phrase: "first",
				insertAtSeconds: 10,
				sentenceStartSeconds: 10,
				durationSeconds: 3,
				relativePath: "explanations/video-1/clips/000.mp4",
			}),
		];

		expect(buildCompositionParts(clips, 30)).toEqual([
			{ kind: "source", startSeconds: 0, endSeconds: 10 },
			{ kind: "clip", clip: clips[0] },
			{ kind: "source", startSeconds: 10, endSeconds: 30 },
		]);
	});
});

describe("buildExplanationsByIndex", () => {
	it("maps array position to explanation text", () => {
		expect(
			buildExplanationsByIndex([
				{ explanation: "First explanation" },
				{ explanation: "Second explanation" },
			]),
		).toEqual(
			new Map([
				[0, "First explanation"],
				[1, "Second explanation"],
			]),
		);
	});
});

describe("buildPlaybackPhrases", () => {
	it("maps clip parts to enriched-timeline spans with explanations", () => {
		const clips: ExplanationClipManifestEntry[] = [
			makeClip({
				index: 0,
				phrase: "first",
				insertAtSeconds: 10,
				sentenceStartSeconds: 7,
				durationSeconds: 3,
				relativePath: "explanations/video-1/clips/000.mp4",
			}),
			makeClip({
				index: 1,
				phrase: "second",
				insertAtSeconds: 20,
				sentenceStartSeconds: 18,
				durationSeconds: 4,
				relativePath: "explanations/video-1/clips/001.mp4",
			}),
		];
		const parts = buildCompositionParts(clips, 60);
		const explanationsByIndex = buildExplanationsByIndex([
			{ explanation: "Explains first" },
			{ explanation: "Explains second" },
		]);

		expect(
			buildPlaybackPhrases({ parts, explanationsByIndex }),
		).toEqual([
			{
				index: 0,
				phrase: "first",
				explanation: "Explains first",
				startSeconds: 10,
				endSeconds: 13,
			},
			{
				index: 1,
				phrase: "second",
				explanation: "Explains second",
				startSeconds: 26,
				endSeconds: 30,
			},
		]);
	});

	it("returns an empty list when there are no clip parts", () => {
		const parts = buildCompositionParts([], 60);

		expect(
			buildPlaybackPhrases({
				parts,
				explanationsByIndex: new Map(),
			}),
		).toEqual([]);
	});

	it("uses empty explanation when the phrase index is missing", () => {
		const clips: ExplanationClipManifestEntry[] = [
			makeClip({
				index: 2,
				phrase: "orphan",
				insertAtSeconds: 5,
				sentenceStartSeconds: 3,
				durationSeconds: 2,
				relativePath: "explanations/video-1/clips/002.mp4",
			}),
		];
		const parts = buildCompositionParts(clips, 20);

		expect(
			buildPlaybackPhrases({
				parts,
				explanationsByIndex: new Map([[0, "Only first phrase"]]),
			}),
		).toEqual([
			{
				index: 2,
				phrase: "orphan",
				explanation: "",
				startSeconds: 5,
				endSeconds: 7,
			},
		]);
	});
});
