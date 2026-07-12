"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppPageHeader } from "../../components/AppPageHeader";
import { MetadataPanel } from "../../components/MetadataPanel";
import { PlayerPanel } from "../../components/PlayerPanel";
import { useDashPlayer } from "../../hooks/useDashPlayer";
import type { VideoStatusResponse, VideosResponse } from "../../types/video";

async function fetchVideos(): Promise<VideosResponse> {
	const response = await fetch("/api/videos");
	if (!response.ok) {
		throw new Error("Failed to load videos");
	}
	return response.json() as Promise<VideosResponse>;
}

async function fetchVideoStatus(videoId: string): Promise<VideoStatusResponse> {
	const response = await fetch(`/api/videos/${videoId}/status`);
	if (!response.ok) {
		throw new Error("Failed to load video status");
	}
	return response.json() as Promise<VideoStatusResponse>;
}

export default function TaskDetailPage() {
	const params = useParams<{ id: string }>();
	const videoId = params.id;
	const queryClient = useQueryClient();

	const videosQuery = useQuery({
		queryKey: ["videos"],
		queryFn: fetchVideos,
		refetchInterval: 5000,
	});

	const videos = videosQuery.data?.videos ?? [];
	const selectedVideo = useMemo(
		() => videos.find((video) => video.id === videoId) ?? null,
		[videoId, videos],
	);

	const statusQuery = useQuery({
		queryKey: ["video-status", videoId],
		queryFn: () => fetchVideoStatus(videoId),
		enabled: Boolean(
			selectedVideo &&
				selectedVideo.status !== "ready" &&
				selectedVideo.status !== "failed",
		),
		refetchInterval: 3000,
	});

	useEffect(() => {
		const status = statusQuery.data;
		if (!status || !videoId) {
			return;
		}

		queryClient.setQueryData<VideosResponse>(["videos"], (previous) => {
			if (!previous) {
				return previous;
			}
			return {
				videos: previous.videos.map((video) =>
					video.id === videoId
						? {
								...video,
								status: status.status,
								playable: status.playable,
								chunkCount: status.chunkCount,
								failureReason: status.failureReason,
							}
						: video,
				),
			};
		});
	}, [queryClient, videoId, statusQuery.data]);

	const {
		videoRef,
		extendBufferForTime,
		setIsPlaying,
		setCurrentTime,
		setBufferedSeconds,
		setBufferedUntil,
		getBufferedSeconds,
		getBufferedUntil,
		isPlaying,
		currentTime,
		totalDuration,
		bufferedSeconds,
		bufferedUntil,
		loadedSegmentCount,
		playerError,
	} = useDashPlayer(selectedVideo);

	const combinedError =
		(videosQuery.error as Error | null)?.message ?? playerError;
	const canSeek = Boolean(selectedVideo?.playable && videoRef.current);

	return (
		<main className="tasksPage">
			<AppPageHeader
				breadcrumbs={[
					{ label: "Home", href: "/" },
					{ label: "Tasks", href: "/" },
					{ label: selectedVideo?.title ?? "Task" },
				]}
			/>

			<section className="tasksDetailContent">
				<h2 className="tasksDetailTitle">
					{selectedVideo?.title ?? "Task not found"}
				</h2>

				<PlayerPanel
					selectedVideo={selectedVideo}
					videoRef={videoRef}
					isPlaying={isPlaying}
					currentTime={currentTime}
					totalDuration={totalDuration}
					bufferedUntil={bufferedUntil}
					canSeek={canSeek}
					onPlay={() => setIsPlaying(true)}
					onPause={() => setIsPlaying(false)}
					onTogglePlay={() => {
						const videoEl = videoRef.current;
						if (!videoEl || !selectedVideo?.playable) {
							return;
						}

						if (videoEl.paused) {
							void videoEl.play().catch(() => {
								// Keep UI stable if browser blocks playback.
							});
							return;
						}

						videoEl.pause();
					}}
					onSeek={(seconds) => {
						const videoEl = videoRef.current;
						if (!videoEl || !selectedVideo?.playable) {
							return;
						}
						videoEl.currentTime = seconds;
						setCurrentTime(seconds);
						setBufferedSeconds(getBufferedSeconds(videoEl));
						setBufferedUntil(getBufferedUntil(videoEl, seconds));
						extendBufferForTime(seconds);
					}}
					onTimeUpdate={(videoEl) => {
						setCurrentTime(videoEl.currentTime);
						setBufferedSeconds(getBufferedSeconds(videoEl));
						setBufferedUntil(getBufferedUntil(videoEl, videoEl.currentTime));
						extendBufferForTime(videoEl.currentTime);
					}}
					onProgress={(videoEl) => {
						setBufferedSeconds(getBufferedSeconds(videoEl));
						setBufferedUntil(getBufferedUntil(videoEl, videoEl.currentTime));
					}}
				/>

				<MetadataPanel
					selectedVideo={selectedVideo}
					bufferedSeconds={bufferedSeconds}
					totalDuration={totalDuration}
					loadedSegmentCount={loadedSegmentCount}
				/>

				{combinedError ? <p className="tasksPageError">{combinedError}</p> : null}
			</section>
		</main>
	);
}
