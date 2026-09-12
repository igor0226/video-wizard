export type TeacherEmotionMismatch = {
	reason: "unparsed" | "svg-missing" | "svg-class";
	expected?: unknown;
	actual?: unknown;
	topic?: string;
	raw?: unknown;
};

export function logTeacherEmotion(message: unknown): void {
	// biome-ignore lint/suspicious/noConsole: temporary emotion debug
	console.log("teacher-emotion", message);
}

export function logTeacherEmotionMismatch(
	details: TeacherEmotionMismatch,
): void {
	// biome-ignore lint/suspicious/noConsole: temporary emotion debug
	console.warn("teacher-emotion-mismatch", details);
}
