"use client";

import type { VideosResponse } from "../model/types";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { applyVideoStatusToList } from "../utils/apply-video-status-to-list";
import { fetchVideoStatus, isTerminalVideoStatus } from "./video-api";

export function useVideoStatus(videoId: string) {
	const queryClient = useQueryClient();
	const query = useQuery({
		queryKey: ["video-status", videoId],
		queryFn: () => fetchVideoStatus(videoId),
		enabled: Boolean(videoId),
		refetchInterval: (current) =>
			isTerminalVideoStatus(current.state.data?.status) ? false : 3000,
	});

	useEffect(() => {
		const status = query.data;
		if (!status || !videoId) {
			return;
		}
		queryClient.setQueryData<VideosResponse>(["videos"], (previous) =>
			applyVideoStatusToList({ previous, videoId, status }),
		);
	}, [queryClient, videoId, query.data]);

	return {
		status: query.data,
		isLoading: query.isLoading,
		error: query.error,
	};
}
