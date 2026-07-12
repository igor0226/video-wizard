"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { AppHeader } from "./components/AppHeader";
import { MetadataPanel } from "./components/MetadataPanel";
import { PlayerPanel } from "./components/PlayerPanel";
import { UploadModal } from "./components/UploadModal";
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

export default function HomePage() {
	const queryClient = useQueryClient();
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [uploadTitle, setUploadTitle] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

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
		setSelectedVideoId((previous) => {
			if (previous && videos.some((video) => video.id === previous)) {
				return previous;
			}
			return videos[0]?.id ?? null;
		});
	}, [videos]);

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

	const submitUpload = useCallback(
		(event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();

			if (!uploadFile) {
				setUploadError("Choose a video file first.");
				return;
			}
			if (!uploadTitle.trim()) {
				setUploadError("Enter a video name.");
				return;
			}

			const formData = new FormData();
			formData.set("title", uploadTitle);
			formData.set("file", uploadFile);

			setUploadError(null);
			setIsUploading(true);
			setUploadProgress(0);

			const xhr = new XMLHttpRequest();
			xhr.open("POST", "/api/videos/upload");
			xhr.upload.onprogress = (progressEvent) => {
				if (progressEvent.lengthComputable) {
					setUploadProgress((progressEvent.loaded / progressEvent.total) * 100);
				}
			};

			xhr.onerror = () => {
				setIsUploading(false);
				setUploadError("Upload failed due to a network issue.");
			};

			xhr.onload = async () => {
				setIsUploading(false);
				if (xhr.status < 200 || xhr.status >= 300) {
					setUploadError(xhr.responseText || "Upload failed.");
					return;
				}

				const responsePayload = JSON.parse(xhr.responseText) as { id: string };
				setSelectedVideoId(responsePayload.id);
				setUploadTitle("");
				setUploadFile(null);
				setUploadProgress(100);
				setIsUploadModalOpen(false);
				await queryClient.invalidateQueries({ queryKey: ["videos"] });
			};

			xhr.send(formData);
		},
		[queryClient, uploadFile, uploadTitle],
	);

	const combinedError =
		(videosQuery.error as Error | null)?.message ?? playerError;
	const canSeek = Boolean(selectedVideo?.playable && videoRef.current);

	return (
		<main className="appShell">
			<AppHeader onUploadClick={() => setIsUploadModalOpen(true)} />

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

			<UploadModal
				isOpen={isUploadModalOpen}
				uploadTitle={uploadTitle}
				uploadProgress={uploadProgress}
				isUploading={isUploading}
				uploadError={uploadError}
				selectedFileName={uploadFile?.name ?? null}
				onClose={() => setIsUploadModalOpen(false)}
				onTitleChange={setUploadTitle}
				onFileChange={setUploadFile}
				onSubmit={submitUpload}
			/>
		</main>
	);
}
