import type { SpeakingCall } from "@/entities/speaking-session";

export type HistoryFilter = "all" | "completed" | "under10" | "over10";

export function matchesCallHistoryFilter(
	call: SpeakingCall,
	filter: HistoryFilter,
): boolean {
	if (filter === "completed") {
		return call.status === "completed";
	}
	if (filter === "under10") {
		return call.durationSeconds < 600;
	}
	if (filter === "over10") {
		return call.durationSeconds >= 600;
	}
	return true;
}
