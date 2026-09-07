import type { VideoRecord } from "../../storage";

export function getQueuePosition(
	video: VideoRecord,
	allVideos: VideoRecord[],
): number | null {
	if (video.status !== "pending") {
		return null;
	}

	const pending = allVideos
		.filter((entry) => entry.status === "pending")
		.sort((left, right) => left.createdAt.localeCompare(right.createdAt));

	const index = pending.findIndex((entry) => entry.id === video.id);
	return index === -1 ? null : index + 1;
}
