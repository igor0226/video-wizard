import { describe, expect, it } from "vitest";

import { buildExplanationAss, buildExplanationCues } from "./explanation-ass";

describe("buildExplanationCues", () => {
	it("splits explanation sentences and allocates duration by character weight", () => {
		const cues = buildExplanationCues("First sentence. Second sentence.", 10);

		expect(cues).toHaveLength(2);
		expect(cues[0]?.text).toBe("First sentence.");
		expect(cues[1]?.text).toBe("Second sentence.");
		expect(cues[0]?.startSeconds).toBe(0);
		expect(cues[1]?.endSeconds).toBe(10);
	});
});

describe("buildExplanationAss", () => {
	it("escapes ASS control characters and includes phrase title dialogue", () => {
		const ass = buildExplanationAss({
			phrase: "as an {icebreaker}",
			explanation: "Use braces \\ carefully.",
			durationSeconds: 5,
			width: 1280,
			height: 720,
		});

		expect(ass).toContain("PlayResX: 1280");
		expect(ass).toContain("PlayResY: 720");
		expect(ass).toContain("as an \\{icebreaker\\}");
		expect(ass).toContain("Use braces \\\\ carefully.");
		expect(ass).toContain("Style: Title");
		expect(ass).toContain("Style: Body");
	});
});
