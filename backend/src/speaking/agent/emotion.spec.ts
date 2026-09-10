import { describe, expect, it, vi } from "vitest";

import {
	EmotionIntensity,
	TEACHER_EMOTION_TOPIC,
	type EmotionPublisher,
	normalizeEmotionMessage,
	publishEmotion,
} from "./emotion";

describe("emotion", () => {
	it("normalizes valid emotions and intensity", () => {
		expect(
			normalizeEmotionMessage({
				emotion: "smile",
				intensity: EmotionIntensity.High,
				source: "reply",
			}),
		).toEqual({
			emotion: "smile",
			intensity: EmotionIntensity.High,
			source: "reply",
		});
	});

	it("falls back to neutral for invalid emotion or intensity", () => {
		expect(
			normalizeEmotionMessage({
				emotion: "grin",
				intensity: 9,
				source: "reaction",
			}),
		).toEqual({ emotion: "neutral", source: "reaction" });
	});

	it("publishes JSON on the teacher-emotion topic", async () => {
		const publishData = vi.fn<EmotionPublisher["publishData"]>(
			async () => undefined,
		);
		const publisher: EmotionPublisher = { publishData };
		const payload = await publishEmotion({
			publisher,
			message: {
				emotion: "laugh",
				intensity: EmotionIntensity.Medium,
				source: "reply",
			},
		});
		expect(payload.source).toBe("reply");
		expect(publishData).toHaveBeenCalledOnce();
		const published = publishData.mock.calls[0]?.[0];
		expect(published).toBeInstanceOf(Uint8Array);
		if (!(published instanceof Uint8Array)) {
			throw new Error("expected published bytes");
		}
		expect(JSON.parse(new TextDecoder().decode(published))).toEqual(payload);
		expect(publishData.mock.calls[0]?.[1]).toEqual({
			reliable: true,
			topic: TEACHER_EMOTION_TOPIC,
		});
	});
});
