import { parseLearningMode } from "./types";

describe("parseLearningMode", () => {
	it("accepts listening and speaking", () => {
		expect(parseLearningMode("listening")).toBe("listening");
		expect(parseLearningMode("speaking")).toBe("speaking");
	});

	it("falls back to listening for invalid values", () => {
		expect(parseLearningMode("writing")).toBe("listening");
		expect(parseLearningMode(null)).toBe("listening");
	});
});
