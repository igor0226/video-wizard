import type {
	EmotionIntensity,
	EmotionSource,
	TeacherEmotion,
	TeacherEmotionMessage,
} from "../model/types";

import { isRecord } from "@/shared/lib";
import { TEACHER_EMOTIONS } from "../model/types";

const SOURCES: readonly EmotionSource[] = ["reply", "reaction"];
const INTENSITIES = new Set<EmotionIntensity>([1, 2, 3]);

export function parseEmotionMessage(
	payload: Uint8Array,
): TeacherEmotionMessage | null {
	const parsed = decodeJson(payload);
	if (!isRecord(parsed) || !isTeacherEmotion(parsed.emotion)) {
		return null;
	}
	if (!isEmotionSource(parsed.source)) {
		return null;
	}
	const intensity = parseIntensity(parsed.intensity);
	if (intensity === undefined) {
		return { emotion: parsed.emotion, source: parsed.source };
	}
	return { emotion: parsed.emotion, source: parsed.source, intensity };
}

function decodeJson(payload: Uint8Array): unknown {
	try {
		return JSON.parse(new TextDecoder().decode(payload));
	} catch {
		return null;
	}
}

function isTeacherEmotion(value: unknown): value is TeacherEmotion {
	return (
		typeof value === "string" &&
		(TEACHER_EMOTIONS as readonly string[]).includes(value)
	);
}

function isEmotionSource(value: unknown): value is EmotionSource {
	return typeof value === "string" && SOURCES.includes(value as EmotionSource);
}

function parseIntensity(value: unknown): EmotionIntensity | undefined {
	if (
		typeof value !== "number" ||
		!INTENSITIES.has(value as EmotionIntensity)
	) {
		return undefined;
	}
	return value as EmotionIntensity;
}
