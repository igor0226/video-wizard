import { describe, expect, it } from "vitest";

import { buildCompositionParts } from "./compose-plan";
import type { ExplanationClipManifestEntry } from "../generating-clips/explanation-clip.service";

describe("buildCompositionParts", () => {
	it("returns a single source part when there are no clips", () => {
		expect(buildCompositionParts([], 120)).toEqual([
			{ kind: "source", startSeconds: 0, endSeconds: 120 },
		]);
	});

	it("inserts clips after source segments at each insert time", () => {
		const clips: ExplanationClipManifestEntry[] = [
			{
				index: 0,
				phrase: "first",
				insertAtSeconds: 10,
				durationSeconds: 3,
				relativePath: "explanations/video-1/clips/000.mp4",
			},
			{
				index: 1,
				phrase: "second",
				insertAtSeconds: 20,
				durationSeconds: 4,
				relativePath: "explanations/video-1/clips/001.mp4",
			},
		];

		expect(buildCompositionParts(clips, 60)).toEqual([
			{ kind: "source", startSeconds: 0, endSeconds: 10 },
			{ kind: "clip", clip: clips[0] },
			{ kind: "source", startSeconds: 10, endSeconds: 20 },
			{ kind: "clip", clip: clips[1] },
			{ kind: "source", startSeconds: 20, endSeconds: 60 },
		]);
	});

	it("keeps clips at the same insert time adjacent in phrase order", () => {
		const clips: ExplanationClipManifestEntry[] = [
			{
				index: 1,
				phrase: "second phrase",
				insertAtSeconds: 12,
				durationSeconds: 3,
				relativePath: "explanations/video-1/clips/001.mp4",
			},
			{
				index: 0,
				phrase: "first phrase",
				insertAtSeconds: 12,
				durationSeconds: 3,
				relativePath: "explanations/video-1/clips/000.mp4",
			},
		];

		const parts = buildCompositionParts(clips, 30);
		expect(parts).toEqual([
			{ kind: "source", startSeconds: 0, endSeconds: 12 },
			{ kind: "clip", clip: clips[1] },
			{ kind: "clip", clip: clips[0] },
			{ kind: "source", startSeconds: 12, endSeconds: 30 },
		]);
	});
});
