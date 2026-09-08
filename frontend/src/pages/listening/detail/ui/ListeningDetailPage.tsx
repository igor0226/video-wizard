"use client";

import type { VideoStatusResponse, VideosResponse } from "@/entities/video";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import {
	fetchVideoStatus,
	fetchVideos,
	isTerminalVideoStatus,
} from "@/entities/video";
import { useRetryVideo } from "@/features/retry-video";
import "@/widgets/listening-library";
import { AppPageHeader } from "@/widgets/page-header";
import { ProcessingHistoryPanel } from "@/widgets/processing-history";
import { PlayerPanel } from "@/widgets/video-player";

export default function ListeningDetailPage() {
	const params = useParams<{ id: string }>();
	const videoId = params?.id ?? "";
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
			isTerminalVideoStatus(query.state.data?.status) ? false : 3000,
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
	const languageSummary = buildLanguageSummary(statusData, selectedVideo);

	return (
		<main className="tasksPage">
			<AppPageHeader
				title="Listening"
				breadcrumbs={[
					{ label: "Home", href: "/dashboard" },
					{ label: "Tasks", href: "/listening" },
					{ label: selectedVideo?.title ?? "Task" },
				]}
			/>

			<section className="tasksDetailContent">
				{languageSummary ? (
					<p className="tasksDetailMeta">{languageSummary}</p>
				) : null}

				<PlayerPanel selectedVideo={selectedVideo} />

				<ProcessingHistoryPanel
					events={statusData?.processingHistory ?? null}
					currentStep={
						statusData?.processingStep ?? selectedVideo?.processingStep ?? null
					}
					queuePosition={
						statusData?.queuePosition ?? selectedVideo?.queuePosition ?? null
					}
					failureReason={
						statusData?.failureReason ?? selectedVideo?.failureReason ?? null
					}
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

function buildLanguageSummary(
	statusData: VideoStatusResponse | undefined,
	selectedVideo: VideosResponse["videos"][number] | null,
): string | null {
	const sourceLanguage =
		statusData?.sourceLanguage ?? selectedVideo?.sourceLanguage ?? null;
	const explanationLanguage =
		statusData?.explanationLanguage ??
		selectedVideo?.explanationLanguage ??
		null;
	const languageLevel =
		statusData?.languageLevel ?? selectedVideo?.languageLevel ?? null;
	if (!sourceLanguage || !explanationLanguage || !languageLevel) {
		return null;
	}
	return `${sourceLanguage} · explained in ${explanationLanguage} · ${languageLevel}`;
}
