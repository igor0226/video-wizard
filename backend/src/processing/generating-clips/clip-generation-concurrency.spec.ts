import { afterEach, describe, expect, it } from "vitest";

import { resolveClipGenerationConcurrency } from "./clip-generation-concurrency";

describe("resolveClipGenerationConcurrency", () => {
	afterEach(() => {
		delete process.env.CLIP_GENERATION_CONCURRENCY;
	});

	it("returns 3 when unset", () => {
		expect(resolveClipGenerationConcurrency()).toBe(3);
	});

	it("returns the parsed value when valid", () => {
		process.env.CLIP_GENERATION_CONCURRENCY = "5";
		expect(resolveClipGenerationConcurrency()).toBe(5);
	});

	it("returns 3 for invalid or sub-1 values", () => {
		process.env.CLIP_GENERATION_CONCURRENCY = "0";
		expect(resolveClipGenerationConcurrency()).toBe(3);

		process.env.CLIP_GENERATION_CONCURRENCY = "abc";
		expect(resolveClipGenerationConcurrency()).toBe(3);
	});
});
