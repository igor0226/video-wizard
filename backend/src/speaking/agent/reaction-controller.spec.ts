import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmotionIntensity, EmotionPublisher } from "./emotion";
import { ReactionController } from "./reaction-controller";

vi.mock("./reaction-classifier", () => ({
	ReactionClassifier: class {
		async classify(text: string) {
			if (text.includes("joke")) {
				return { emotion: "laugh", intensity: EmotionIntensity.High };
			}
			return { emotion: "upset", intensity: EmotionIntensity.Medium };
		}
	},
}));

describe("ReactionController", () => {
	const publisher = {
		publishData: vi.fn<EmotionPublisher["publishData"]>(async () => undefined),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	it("publishes a thoughtful listening cue when the user starts speaking", async () => {
		const controller = new ReactionController(publisher, 200);
		await controller.onUserStartedSpeaking();
		const published = publisher.publishData.mock.calls[0]?.[0];
		expect(published).toBeInstanceOf(Uint8Array);
		if (!(published instanceof Uint8Array)) {
			throw new Error("expected published bytes");
		}
		expect(JSON.parse(new TextDecoder().decode(published))).toMatchObject({
			emotion: "thoughtful",
			source: "reaction",
		});
	});

	it("classifies distinct transcript finals into different reaction emotions", async () => {
		const controller = new ReactionController(publisher, 200);
		controller.onTranscript({
			transcript: "My dog died yesterday",
			isFinal: true,
		});
		await vi.runAllTimersAsync();
		controller.onTranscript({
			transcript: "Then I heard a joke",
			isFinal: true,
		});
		await vi.runAllTimersAsync();
		const payloads = publisher.publishData.mock.calls.map((call) => {
			const bytes = call[0];
			if (!(bytes instanceof Uint8Array)) {
				throw new Error("expected published bytes");
			}
			return JSON.parse(new TextDecoder().decode(bytes));
		});
		expect(payloads.map((item) => item.emotion)).toEqual(["upset", "laugh"]);
		expect(payloads.every((item) => item.source === "reaction")).toBe(true);
	});
});
