import type { VideoStatusResponse, VideosResponse } from "../model/types";

import { apiUrl } from "@/shared/api";

export async function fetchVideos(): Promise<VideosResponse> {
	const response = await fetch(apiUrl("/api/videos"));
	if (!response.ok) {
		throw new Error("Failed to load videos");
	}
	return response.json() as Promise<VideosResponse>;
}

export async function fetchVideoStatus(
	videoId: string,
): Promise<VideoStatusResponse> {
	const response = await fetch(apiUrl(`/api/videos/${videoId}/status`));
	if (!response.ok) {
		throw new Error("Failed to load video status");
	}
	return response.json() as Promise<VideoStatusResponse>;
}

export function isTerminalVideoStatus(status: string | undefined): boolean {
	return status === "ready" || status === "failed";
}
