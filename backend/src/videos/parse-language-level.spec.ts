import { describe, expect, it } from "vitest";

import { parseLanguageLevel } from "./parse-language-level";

describe("parseLanguageLevel", () => {
	it("accepts valid CEFR levels case-insensitively", () => {
		expect(parseLanguageLevel("b1")).toBe("B1");
		expect(parseLanguageLevel("C2")).toBe("C2");
	});

	it("returns null for invalid or missing values", () => {
		expect(parseLanguageLevel(undefined)).toBeNull();
		expect(parseLanguageLevel("")).toBeNull();
		expect(parseLanguageLevel("beginner")).toBeNull();
	});
});
