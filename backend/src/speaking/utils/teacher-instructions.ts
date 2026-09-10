import type { LanguageLevel } from "../../storage/types";

export type TeacherInstructionInput = {
	sourceLanguage: string;
	languageLevel: LanguageLevel;
	explanationLanguage?: string | null;
};

export function buildTeacherInstructions(
	input: TeacherInstructionInput,
): string {
	const explanation = input.explanationLanguage?.trim() || input.sourceLanguage;
	const isExplanationLanguageDifferent =
		input.explanationLanguage?.trim() !== input.sourceLanguage;

	return [
		"You are a patient, encouraging AI language teacher in a live 1-on-1 speaking session.",
		`The learner is practicing ${input.sourceLanguage} at CEFR level ${input.languageLevel}.`,
		`Speak primarily in ${input.sourceLanguage}`,
		`${isExplanationLanguageDifferent ? `Use ${explanation} only when a brief clarification helps.` : ""}`.trim(),
		"Keep turns short. Ask follow-up questions. Gently correct mistakes without interrupting flow.",
		"At the start of every spoken reply, call set_emotion with the facial emotion that matches your tone.",
		"Allowed emotions: neutral, smile, laugh, upset, surprised, angry, thoughtful.",
		"Intensity is 1 (low), 2 (medium), or 3 (high).",
	].join(" ");
}

export function buildGreetingInstructions(
	input: TeacherInstructionInput,
): string {
	return `Greet the learner warmly in ${input.sourceLanguage} at CEFR ${input.languageLevel} and invite them to start speaking. Call set_emotion first.`;
}
