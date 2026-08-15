import { describe, expect, it } from "vitest";

import { resolveResumeStep } from "./resolve-resume-step";
import type { VideoProcessingHistory } from "./types";

function makeHistory(
	events: VideoProcessingHistory["events"],
): VideoProcessingHistory {
	return {
		videoId: "video-1",
		currentStep: "failed",
		events,
		updatedAt: "2026-01-01T00:00:00.000Z",
	};
}

describe("resolveResumeStep", () => {
	it("returns the most recent resumable failed step", () => {
		const history = makeHistory([
			{
				step: "audio_extract",
				status: "completed",
				at: "2026-01-01T00:00:01.000Z",
			},
			{
				step: "transcribing",
				status: "failed",
				at: "2026-01-01T00:00:02.000Z",
				message: "Whisper failed",
			},
			{
				step: "detecting_phrases",
				status: "failed",
				at: "2026-01-01T00:00:03.000Z",
				message: "phrase detection failed",
			},
		]);

		expect(resolveResumeStep(history)).toBe("detecting_phrases");
	});

	it("defaults to audio_extract when history has no failed resumable step", () => {
		const history = makeHistory([
			{ step: "queued", status: "started", at: "2026-01-01T00:00:00.000Z" },
		]);

		expect(resolveResumeStep(history)).toBe("audio_extract");
	});
});
