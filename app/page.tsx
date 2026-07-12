"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { MetadataPanel } from "./components/MetadataPanel";
import { PlayerPanel } from "./components/PlayerPanel";
import { VideoSidebar } from "./components/VideoSidebar";
import { useDashPlayer } from "./hooks/useDashPlayer";
import type { VideoStatusResponse, VideosResponse } from "./types/video";

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

function HomePageContent() {
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const videoFromUrl = searchParams.get("video");
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

	const videosQuery = useQuery({
		queryKey: ["videos"],
		queryFn: fetchVideos,
		refetchInterval: 5000,
	});

	const videos = videosQuery.data?.videos ?? [];
	const selectedVideo = useMemo(
		() => videos.find((video) => video.id === selectedVideoId) ?? null,
		[selectedVideoId, videos],
	);

	useEffect(() => {
		if (videoFromUrl && videos.some((video) => video.id === videoFromUrl)) {
			setSelectedVideoId(videoFromUrl);
			return;
		}

		setSelectedVideoId((previous) => {
			if (previous && videos.some((video) => video.id === previous)) {
				return previous;
			}
			return videos[0]?.id ?? null;
		});
	}, [videoFromUrl, videos]);

	const statusQuery = useQuery({
		queryKey: ["video-status", selectedVideoId],
		queryFn: () => fetchVideoStatus(selectedVideoId as string),
		enabled: Boolean(
			selectedVideoId &&
				selectedVideo &&
				selectedVideo.status !== "ready" &&
				selectedVideo.status !== "failed",
		),
		refetchInterval: 3000,
	});

	useEffect(() => {
		const status = statusQuery.data;
		if (!status || !selectedVideoId) {
			return;
		}

		queryClient.setQueryData<VideosResponse>(["videos"], (previous) => {
			if (!previous) {
				return previous;
			}
			return {
				videos: previous.videos.map((video) =>
					video.id === selectedVideoId
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
	}, [queryClient, selectedVideoId, statusQuery.data]);

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
		<main className="appShell">
			<AppHeader />

			<section className="appBody">
				<VideoSidebar
					videos={videos}
					selectedVideoId={selectedVideoId}
					onSelectVideo={setSelectedVideoId}
				/>

				<section className="mainContent">
					<h2 className="videoTitle">
						{selectedVideo?.title ?? "Select or upload a video"}
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

					{combinedError ? <p className="errorText">{combinedError}</p> : null}
				</section>
			</section>
		</main>
	);
}

export default function HomePage() {
	return (
		<Suspense
			fallback={
				<main className="appShell">
					<AppHeader />
					<p className="note">Loading...</p>
				</main>
			}
		>
			<HomePageContent />
		</Suspense>
	);
}
