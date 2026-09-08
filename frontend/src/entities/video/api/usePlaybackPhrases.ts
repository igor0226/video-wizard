"use client";

import type { PlaybackPhrasesResponse } from "../model/types";

import { useQuery } from "@tanstack/react-query";

import { apiUrl } from "@/shared/api";

async function fetchPlaybackPhrases(
	videoId: string,
): Promise<PlaybackPhrasesResponse> {
	const response = await fetch(
		apiUrl(`/api/videos/${videoId}/playback-phrases`),
	);

	if (!response.ok) {
		throw new Error("Failed to load playback phrases");
	}

	return response.json() as Promise<PlaybackPhrasesResponse>;
}

export function usePlaybackPhrases(
	videoId: string | undefined,
	playable: boolean | undefined,
) {
	const query = useQuery({
		queryKey: ["playback-phrases", videoId],
		queryFn: () => fetchPlaybackPhrases(videoId as string),
		enabled: Boolean(videoId) && Boolean(playable),
	});

	return {
		phrases: query.data?.phrases ?? [],
		isLoading: query.isLoading,
		error: query.error,
	};
}
