import type { TeacherCallRecord } from "../../storage/types";

export function serializeCallDispatchMetadata(input: {
	call: TeacherCallRecord;
	topic?: string;
}): string {
	const topic = input.topic?.trim();
	return JSON.stringify({
		callId: input.call.id,
		sourceLanguage: input.call.sourceLanguage,
		languageLevel: input.call.languageLevel,
		explanationLanguage: input.call.explanationLanguage,
		...(topic ? { topic } : {}),
	});
}
