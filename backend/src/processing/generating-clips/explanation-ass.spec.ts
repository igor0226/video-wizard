import { describe, expect, it } from "vitest";

import {
	buildExplanationAss,
	buildExplanationCues,
	getAssStyleMetrics,
	resolveClosingCueTiming,
	resolveExplanationBodyTiming,
} from "./explanation-ass";

describe("buildExplanationCues", () => {
	it("splits explanation sentences and allocates duration by character weight", () => {
		const cues = buildExplanationCues("First sentence. Second sentence.", 10);

		expect(cues).toHaveLength(2);
		expect(cues[0]?.text).toBe("First sentence.");
		expect(cues[1]?.text).toBe("Second sentence.");
		expect(cues[0]?.startSeconds).toBe(0);
		expect(cues[1]?.endSeconds).toBe(10);
	});

	it("offsets body cues to match delayed TTS audio", () => {
		const cues = buildExplanationCues("First sentence. Second sentence.", 3, 0.5);

		expect(cues[0]?.startSeconds).toBe(0.5);
		expect(cues[1]?.endSeconds).toBe(3.5);
	});
});

describe("resolveExplanationBodyTiming", () => {
	it("offsets explanation cues by the phrase share of TTS duration", () => {
		expect(
			resolveExplanationBodyTiming({
				phrase: "Hello world",
				explanation: "A greeting.",
				ttsDurationSeconds: 4,
				clipGapSeconds: 0.5,
			}),
		).toEqual({
			bodyStartOffsetSeconds: 2.5,
			bodyDurationSeconds: 2,
		});
	});
});

describe("resolveClosingCueTiming", () => {
	it("starts the closing cue after speech and the closing gap", () => {
		expect(
			resolveClosingCueTiming({
				clipGapSeconds: 0.5,
				closingGapSeconds: 0.3,
				speechDurationSeconds: 3,
				closingDurationSeconds: 1.2,
			}),
		).toEqual({
			startSeconds: 3.8,
			durationSeconds: 1.2,
		});
	});
});

describe("buildExplanationAss", () => {
	it("escapes ASS control characters and uses centered larger styles", () => {
		const ass = buildExplanationAss({
			phrase: "as an {icebreaker}",
			explanation: "Use braces \\ carefully.",
			durationSeconds: 5,
			ttsDurationSeconds: 4,
			bodyStartOffsetSeconds: 2.5,
			bodyDurationSeconds: 2,
			width: 1280,
			height: 720,
		});
		const metrics = getAssStyleMetrics(720);

		expect(ass).toContain("PlayResX: 1280");
		expect(ass).toContain("PlayResY: 720");
		expect(ass).toContain("as an \\{icebreaker\\}");
		expect(ass).toContain("Use braces \\\\ carefully.");
		expect(ass).toContain(`Style: Title,DejaVu Sans,${metrics.titleFontSize}`);
		expect(ass).toContain(`Style: Body,DejaVu Sans,${metrics.bodyFontSize}`);
		expect(metrics.titleFontSize).toBe(56);
		expect(metrics.bodyFontSize).toBe(37);
		expect(metrics.marginV).toBe(259);
		expect(ass).toContain(",8,10,10,259,1");
		expect(ass).toContain(",2,10,10,259,2");
	});

	it("renders a separate closing cue when provided", () => {
		const ass = buildExplanationAss({
			phrase: "icebreaker",
			explanation: "A friendly opener.",
			durationSeconds: 6,
			ttsDurationSeconds: 4,
			bodyStartOffsetSeconds: 2.5,
			bodyDurationSeconds: 2,
			width: 1280,
			height: 720,
			closingCue: {
				startSeconds: 3.8,
				endSeconds: 5,
				text: "Let's listen once again!",
			},
		});

		expect(ass).toContain("Let's listen once again!");
		expect(ass).toContain("0:00:03.80");
		expect(ass).toContain("0:00:05.00");
	});
});
