import type { TeacherCallRecord } from "../types";

export function normalizeTeacherCallRecord(
	record: TeacherCallRecord,
): TeacherCallRecord {
	return {
		id: record.id,
		userId: record.userId,
		roomName: record.roomName,
		status: record.status,
		sourceLanguage: record.sourceLanguage,
		languageLevel: record.languageLevel,
		explanationLanguage: record.explanationLanguage,
		agentDispatchId: record.agentDispatchId,
		endedReason: record.endedReason,
		createdAt: record.createdAt,
		endedAt: record.endedAt,
	};
}
