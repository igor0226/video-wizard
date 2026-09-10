import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmotionIntensity } from "./emotion";
import { ReactionClassifier } from "./reaction-classifier";

vi.mock("openai", () => {
	const parse = vi.fn();
	return {
		default: class OpenAI {
			responses = { parse };
		},
		__parse: parse,
	};
});

describe("ReactionClassifier", () => {
	beforeEach(() => {
		process.env.OPENAI_API_KEY = "test-key";
	});

	it("returns thoughtful for empty utterances without calling OpenAI", async () => {
		const classifier = new ReactionClassifier();
		await expect(classifier.classify("   ")).resolves.toEqual({
			emotion: "thoughtful",
			intensity: EmotionIntensity.Low,
		});
	});

	it("maps a classified utterance to an emotion", async () => {
		const openai = await import("openai");
		const parse = (openai as unknown as { __parse: ReturnType<typeof vi.fn> })
			.__parse;
		parse.mockResolvedValueOnce({
			output_parsed: {
				emotion: "laugh",
				intensity: EmotionIntensity.High,
			},
		});
		const classifier = new ReactionClassifier();
		await expect(
			classifier.classify("That joke was hilarious"),
		).resolves.toEqual({
			emotion: "laugh",
			intensity: EmotionIntensity.High,
		});
	});
});
