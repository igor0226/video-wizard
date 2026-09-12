import type { CallHistoryItem, SpeakingCall } from "../model/types";

import { formatCreatedAt, formatTime } from "@/shared/lib";

const HISTORY_STATUS = {
	active: "in_progress",
	ended: "completed",
	failed: "failed",
} as const;

export function mapCallHistoryItem(item: CallHistoryItem): SpeakingCall {
	const durationSeconds = item.durationSeconds ?? 0;
	return {
		id: item.id,
		callId: item.id,
		date: formatCreatedAt(item.createdAt),
		duration:
			item.durationSeconds == null ? "—" : formatTime(item.durationSeconds),
		durationSeconds,
		status: HISTORY_STATUS[item.status],
		languageLevel: item.languageLevel,
		sourceLanguage: item.sourceLanguage,
		explanationLanguage: item.explanationLanguage,
	};
}
