import {
	parseEmotionMessage,
	TEACHER_EMOTION_TOPIC,
} from "@/entities/speaking-session";

export function logTeacherEmotion(payload: Uint8Array, topic?: string): void {
	if (topic !== TEACHER_EMOTION_TOPIC) {
		return;
	}
	const message = parseEmotionMessage(payload);
	if (!message) {
		return;
	}
	// v1: log only; teacher SVG emotion rendering is deferred.
	// biome-ignore lint/suspicious/noConsole: first version surfaces emotions in the console
	console.log("teacher-emotion", message);
}
