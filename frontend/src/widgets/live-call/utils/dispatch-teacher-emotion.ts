import {
	parseEmotionMessage,
	TEACHER_EMOTION_TOPIC,
	type TeacherEmotionMessage,
} from "@/entities/speaking-session";
import {
	isRecord,
	logTeacherEmotion,
	logTeacherEmotionMismatch,
} from "@/shared/lib";

export function resolveDataTopic(
	kindOrTopic?: unknown,
	topic?: unknown,
): string | undefined {
	if (typeof topic === "string") {
		return topic;
	}
	if (typeof kindOrTopic === "string") {
		return kindOrTopic;
	}
	return undefined;
}

export function dispatchTeacherEmotion(
	payload: Uint8Array,
	topic: string | undefined,
	onTeacherEmotion: (message: TeacherEmotionMessage) => void,
): void {
	if (topic && topic !== TEACHER_EMOTION_TOPIC) {
		return;
	}
	const message = parseEmotionMessage(payload);
	if (message) {
		logTeacherEmotion(message);
		onTeacherEmotion(message);
		return;
	}
	logUnparsedEmotion(payload, topic);
}

function logUnparsedEmotion(payload: Uint8Array, topic?: string): void {
	const raw = decodeEmotionPayload(payload);
	if (topic !== TEACHER_EMOTION_TOPIC && !(isRecord(raw) && "emotion" in raw)) {
		return;
	}
	logTeacherEmotionMismatch({ reason: "unparsed", topic, raw });
}

function decodeEmotionPayload(payload: Uint8Array): unknown {
	try {
		return JSON.parse(new TextDecoder().decode(payload));
	} catch {
		return null;
	}
}
