import { parseEmotionMessage } from "./parse-emotion-message";

function encode(value: unknown): Uint8Array {
	return new TextEncoder().encode(JSON.stringify(value));
}

describe("parseEmotionMessage", () => {
	it("parses a valid emotion payload", () => {
		expect(
			parseEmotionMessage(
				encode({ emotion: "smile", intensity: 2, source: "reply" }),
			),
		).toEqual({ emotion: "smile", intensity: 2, source: "reply" });
	});

	it("omits invalid intensity and still returns the emotion", () => {
		expect(
			parseEmotionMessage(
				encode({ emotion: "thoughtful", intensity: 9, source: "reaction" }),
			),
		).toEqual({ emotion: "thoughtful", source: "reaction" });
	});

	it("defaults a missing source and accepts string intensity", () => {
		expect(
			parseEmotionMessage(encode({ emotion: "angry", intensity: "3" })),
		).toEqual({ emotion: "angry", intensity: 3, source: "reply" });
	});

	it("returns null for invalid JSON, emotion, or source", () => {
		expect(parseEmotionMessage(new TextEncoder().encode("{"))).toBeNull();
		expect(
			parseEmotionMessage(encode({ emotion: "wink", source: "reply" })),
		).toBeNull();
		expect(
			parseEmotionMessage(encode({ emotion: "smile", source: "other" })),
		).toBeNull();
	});
});
