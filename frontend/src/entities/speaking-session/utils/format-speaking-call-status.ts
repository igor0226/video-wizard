import type { SpeakingCallStatus } from "../model/types";

const STATUS_LABEL: Record<SpeakingCallStatus, string> = {
	connecting: "Connecting",
	in_progress: "In progress",
	completed: "Completed",
	failed: "Failed",
	cancelled: "Cancelled",
};

export function formatSpeakingCallStatus(status: SpeakingCallStatus): string {
	return STATUS_LABEL[status];
}
