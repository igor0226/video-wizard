import type { VideoItem } from "@/entities/video";

import { getTaskStatusLabel } from "@/entities/video";

export type StatusFilterKey = "completed" | "inProgress" | "failed";

export const DEFAULT_STATUS_FILTERS: Record<StatusFilterKey, boolean> = {
	completed: false,
	inProgress: false,
	failed: false,
};

export function matchesVideoStatus(
	video: VideoItem,
	filters: Record<StatusFilterKey, boolean>,
): boolean {
	const anyActive = Object.values(filters).some(Boolean);
	if (!anyActive) {
		return true;
	}
	const label = getTaskStatusLabel(video.status);
	if (filters.completed && label === "Completed") {
		return true;
	}
	if (filters.failed && label === "Failed") {
		return true;
	}
	if (filters.inProgress && (label === "Queued" || label === "Processing")) {
		return true;
	}
	return false;
}

export function matchesVideoQuery(
	video: VideoItem,
	searchQuery: string,
): boolean {
	const query = searchQuery.trim().toLowerCase();
	if (query.length === 0) {
		return true;
	}
	return (
		video.title.toLowerCase().includes(query) ||
		video.id.toLowerCase().includes(query)
	);
}
