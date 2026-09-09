import type { TeacherCallRecord } from "../../storage/types";

export function serializeCallDispatchMetadata(call: TeacherCallRecord): string {
	return JSON.stringify({
		callId: call.id,
		sourceLanguage: call.sourceLanguage,
		languageLevel: call.languageLevel,
		explanationLanguage: call.explanationLanguage,
	});
}
