"use client";

import type { VideoStatusResponse, VideosResponse } from "../../types/video";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { AppPageHeader } from "../../components/AppPageHeader/AppPageHeader";
import { PlayerPanel } from "../../components/PlayerPanel/PlayerPanel";
import { ProcessingHistoryPanel } from "../../components/ProcessingHistoryPanel/ProcessingHistoryPanel";
import { useRetryVideo } from "../../hooks/useRetryVideo";
import { apiUrl } from "../../lib/api";

import "../../styles/tasks-page.css";

async function fetchVideos(): Promise<VideosResponse> {
	const response = await fetch(apiUrl("/api/videos"));
	if (!response.ok) {
		throw new Error("Failed to load videos");
	}
	return response.json() as Promise<VideosResponse>;
}

async function fetchVideoStatus(videoId: string): Promise<VideoStatusResponse> {
	const response = await fetch(apiUrl(`/api/videos/${videoId}/status`));
	if (!response.ok) {
		throw new Error("Failed to load video status");
	}
	return response.json() as Promise<VideoStatusResponse>;
}

function isTerminalStatus(status: string | undefined): boolean {
	return status === "ready" || status === "failed";
}

export default function TaskDetailPage() {
	const params = useParams<{ id: string }>();
	const videoId = params.id;
	const queryClient = useQueryClient();
	const { retryVideo, isRetrying } = useRetryVideo(videoId);

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
		enabled: Boolean(videoId),
		refetchInterval: (query) =>
			isTerminalStatus(query.state.data?.status) ? false : 3000,
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
								processingStep: status.processingStep,
								queuePosition: status.queuePosition,
								sourceLanguage: status.sourceLanguage,
								explanationLanguage: status.explanationLanguage,
								languageLevel: status.languageLevel,
							}
						: video,
				),
			};
		});
	}, [queryClient, videoId, statusQuery.data]);

	const pageError =
		(videosQuery.error as Error | null)?.message ??
		(statusQuery.error as Error | null)?.message ??
		null;

	const statusData = statusQuery.data;
	const historyEvents = statusData?.processingHistory ?? null;
	const currentStep =
		statusData?.processingStep ?? selectedVideo?.processingStep ?? null;
	const queuePosition =
		statusData?.queuePosition ?? selectedVideo?.queuePosition ?? null;
	const failureReason =
		statusData?.failureReason ?? selectedVideo?.failureReason ?? null;
	const sourceLanguage =
		statusData?.sourceLanguage ?? selectedVideo?.sourceLanguage ?? null;
	const explanationLanguage =
		statusData?.explanationLanguage ??
		selectedVideo?.explanationLanguage ??
		null;
	const languageLevel =
		statusData?.languageLevel ?? selectedVideo?.languageLevel ?? null;
	const languageSummary =
		sourceLanguage && explanationLanguage && languageLevel
			? `${sourceLanguage} · explained in ${explanationLanguage} · ${languageLevel}`
			: null;

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
				{languageSummary ? (
					<p className="tasksDetailMeta">{languageSummary}</p>
				) : null}

				<PlayerPanel selectedVideo={selectedVideo} />

				<ProcessingHistoryPanel
					events={historyEvents}
					currentStep={currentStep}
					queuePosition={queuePosition}
					failureReason={failureReason}
					isLoading={statusQuery.isLoading}
					canRetry={statusData?.status === "failed"}
					onRetry={() => retryVideo()}
					isRetrying={isRetrying}
				/>

				{pageError ? <p className="tasksPageError">{pageError}</p> : null}
			</section>
		</main>
	);
}
