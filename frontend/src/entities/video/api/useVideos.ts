"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchVideos } from "./video-api";

export function useVideos() {
	const query = useQuery({
		queryKey: ["videos"],
		queryFn: fetchVideos,
		refetchInterval: 5000,
	});

	return {
		videos: query.data?.videos ?? [],
		error: query.error,
	};
}
