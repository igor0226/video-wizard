import type {
	LanguageLevel,
	TeacherCallRecord,
	TeacherCallStatus,
} from "../../storage/types";

export type TeacherCallHistoryItem = {
	id: string;
	status: TeacherCallStatus;
	sourceLanguage: string;
	languageLevel: LanguageLevel;
	explanationLanguage: string | null;
	createdAt: string;
	endedAt: string | null;
	durationSeconds: number | null;
};

export function toCallHistoryItem(
	record: TeacherCallRecord,
): TeacherCallHistoryItem {
	return {
		id: record.id,
		status: record.status,
		sourceLanguage: record.sourceLanguage,
		languageLevel: record.languageLevel,
		explanationLanguage: record.explanationLanguage,
		createdAt: record.createdAt,
		endedAt: record.endedAt,
		durationSeconds: durationSecondsFromRange(record),
	};
}

function durationSecondsFromRange(record: TeacherCallRecord): number | null {
	if (!record.endedAt) {
		return null;
	}
	const startMs = Date.parse(record.createdAt);
	const endMs = Date.parse(record.endedAt);
	if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
		return null;
	}
	return Math.max(0, Math.floor((endMs - startMs) / 1000));
}
