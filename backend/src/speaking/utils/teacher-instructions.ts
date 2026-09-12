import type { LanguageLevel } from "../../storage/types";

export type TeacherInstructionInput = {
	sourceLanguage: string;
	languageLevel: LanguageLevel;
	explanationLanguage?: string | null;
	topic?: string | null;
};

export function buildTeacherInstructions(
	input: TeacherInstructionInput,
): string {
	const explanation = input.explanationLanguage?.trim() || input.sourceLanguage;
	const isExplanationLanguageDifferent =
		input.explanationLanguage?.trim() !== input.sourceLanguage;
	const topic = input.topic?.trim();

	return [
		"You are a patient, encouraging AI language teacher in a live 1-on-1 speaking session.",
		`The learner is practicing ${input.sourceLanguage} at CEFR level ${input.languageLevel}.`,
		topic
			? `The practice scenario is: ${topic}. Stay on this scenario and keep questions and vocabulary in that context.`
			: "",
		`Speak primarily in ${input.sourceLanguage}`,
		`${isExplanationLanguageDifferent ? `Use ${explanation} only when a brief clarification helps.` : ""}`.trim(),
		"Keep turns short. Ask follow-up questions. Gently correct mistakes without interrupting flow.",
		"At the start of every spoken reply, call set_emotion with the facial emotion that matches your tone.",
		"Allowed emotions: neutral, smile, laugh, upset, surprised, angry, thoughtful.",
		"Intensity is 1 (low), 2 (medium), or 3 (high).",
	]
		.filter(Boolean)
		.join(" ");
}

export function buildGreetingInstructions(
	input: TeacherInstructionInput,
): string {
	const topic = input.topic?.trim();
	const opener = topic
		? `and open the session on this scenario: ${topic}`
		: "and invite them to start speaking";
	return `Greet the learner warmly in ${input.sourceLanguage} at CEFR ${input.languageLevel} ${opener}. Call set_emotion first.`;
}
