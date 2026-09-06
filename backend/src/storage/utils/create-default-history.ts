import type { VideoProcessingHistory } from "../types";

export function createDefaultHistory(videoId: string): VideoProcessingHistory {
	return {
		videoId,
		currentStep: "queued",
		events: [],
		updatedAt: new Date().toISOString(),
	};
}
