"use client";

import type { VideoRetryResponse } from "../types/video";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiUrl } from "../lib/api";

async function retryVideoRequest(videoId: string): Promise<VideoRetryResponse> {
	const response = await fetch(apiUrl(`/api/videos/${videoId}/retry`), {
		method: "POST",
	});

	if (!response.ok) {
		if (response.status === 404) {
			throw new Error("Video not found");
		}
		if (response.status === 409) {
			throw new Error("Only failed videos can be retried");
		}
		throw new Error("Failed to retry video processing");
	}

	return response.json() as Promise<VideoRetryResponse>;
}

export function useRetryVideo(videoId: string) {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => retryVideoRequest(videoId),
		onSuccess: async () => {
			toast.success("Video processing will be retried");
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["video-status", videoId] }),
				queryClient.invalidateQueries({ queryKey: ["videos"] }),
			]);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	return {
		retryVideo: mutation.mutate,
		isRetrying: mutation.isPending,
	};
}
