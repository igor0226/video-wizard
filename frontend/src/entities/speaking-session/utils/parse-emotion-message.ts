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
	const source = resolveEmotionSource(parsed.source);
	if (!source) {
		return null;
	}
	const intensity = parseIntensity(parsed.intensity);
	if (intensity === undefined) {
		return { emotion: parsed.emotion, source };
	}
	return { emotion: parsed.emotion, source, intensity };
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

function resolveEmotionSource(value: unknown): EmotionSource | null {
	if (value === undefined) {
		return "reply";
	}
	if (typeof value === "string" && SOURCES.includes(value as EmotionSource)) {
		return value as EmotionSource;
	}
	return null;
}

function parseIntensity(value: unknown): EmotionIntensity | undefined {
	const intensity = typeof value === "string" ? Number(value) : value;
	if (
		typeof intensity !== "number" ||
		!INTENSITIES.has(intensity as EmotionIntensity)
	) {
		return undefined;
	}
	return intensity as EmotionIntensity;
}
