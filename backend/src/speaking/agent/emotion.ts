export type TeacherEmotion =
	| "neutral"
	| "smile"
	| "laugh"
	| "upset"
	| "surprised"
	| "angry"
	| "thoughtful";

export enum EmotionIntensity {
	Low = 1,
	Medium = 2,
	High = 3,
}

export type EmotionSource = "reply" | "reaction";

export interface TeacherEmotionMessage {
	emotion: TeacherEmotion;
	intensity?: EmotionIntensity;
	source: EmotionSource;
}

export const TEACHER_EMOTIONS: readonly TeacherEmotion[] = [
	"neutral",
	"smile",
	"laugh",
	"upset",
	"surprised",
	"angry",
	"thoughtful",
];

export const TEACHER_EMOTION_TOPIC = "teacher-emotion";

export type EmotionPublisher = {
	publishData: (
		data: Uint8Array,
		options: { reliable: boolean; topic: string },
	) => Promise<void> | void;
};

const INTENSITY_VALUES = new Set<number>([
	EmotionIntensity.Low,
	EmotionIntensity.Medium,
	EmotionIntensity.High,
]);

export function isTeacherEmotion(value: unknown): value is TeacherEmotion {
	return (
		typeof value === "string" &&
		(TEACHER_EMOTIONS as readonly string[]).includes(value)
	);
}

export function parseEmotionIntensity(
	value: unknown,
): EmotionIntensity | undefined {
	if (typeof value !== "number" || !INTENSITY_VALUES.has(value)) {
		return undefined;
	}
	return value as EmotionIntensity;
}

export function normalizeEmotionMessage(input: {
	emotion?: unknown;
	intensity?: unknown;
	source: EmotionSource;
}): TeacherEmotionMessage {
	const emotion = isTeacherEmotion(input.emotion) ? input.emotion : "neutral";
	const intensity = parseEmotionIntensity(input.intensity);
	if (intensity === undefined) {
		return { emotion, source: input.source };
	}
	return { emotion, intensity, source: input.source };
}

export async function publishEmotion(input: {
	publisher: EmotionPublisher;
	message: {
		emotion?: unknown;
		intensity?: unknown;
		source: EmotionSource;
	};
}): Promise<TeacherEmotionMessage> {
	const payload = normalizeEmotionMessage(input.message);
	const bytes = new TextEncoder().encode(JSON.stringify(payload));
	await input.publisher.publishData(bytes, {
		reliable: true,
		topic: TEACHER_EMOTION_TOPIC,
	});
	return payload;
}

export function requireEmotionPublisher(
	participant: EmotionPublisher | undefined,
): EmotionPublisher {
	if (!participant) {
		throw new Error("LiveKit local participant is not available");
	}
	return participant;
}
