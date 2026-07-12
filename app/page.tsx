"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppPageHeader } from "./components/AppPageHeader/AppPageHeader";
import { TasksTable } from "./components/TasksTable/TasksTable";
import { TasksTablePagination } from "./components/TasksTablePagination/TasksTablePagination";
import {
	type StatusFilterKey,
	TasksToolbar,
} from "./components/TasksToolbar/TasksToolbar";
import "./styles/tasks-page.css";
import type { VideosResponse } from "./types/video";

async function fetchVideos(): Promise<VideosResponse> {
	const response = await fetch("/api/videos");
	if (!response.ok) {
		throw new Error("Failed to load videos");
	}
	return response.json() as Promise<VideosResponse>;
}

const DEFAULT_STATUS_FILTERS: Record<StatusFilterKey, boolean> = {
	completed: false,
	inProgress: false,
	failed: false,
};

export default function HomePage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilters, setStatusFilters] = useState(DEFAULT_STATUS_FILTERS);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [focusedId, setFocusedId] = useState<string | null>(null);
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	const videosQuery = useQuery({
		queryKey: ["videos"],
		queryFn: fetchVideos,
		refetchInterval: 5000,
	});

	const videos = videosQuery.data?.videos ?? [];

	const paginatedVideos = useMemo(() => {
		const start = pageIndex * pageSize;
		return videos.slice(start, start + pageSize);
	}, [pageIndex, pageSize, videos]);

	useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(videos.length / pageSize));
		if (pageIndex > pageCount - 1) {
			setPageIndex(Math.max(0, pageCount - 1));
		}
	}, [pageIndex, pageSize, videos.length]);

	const handleStatusFilterChange = (key: StatusFilterKey, checked: boolean) => {
		setStatusFilters((previous) => ({ ...previous, [key]: checked }));
	};

	const handleReset = () => {
		setSearchQuery("");
		setStatusFilters(DEFAULT_STATUS_FILTERS);
	};

	return (
		<main className="tasksPage">
			<AppPageHeader
				breadcrumbs={[{ label: "Home", href: "/" }, { label: "Tasks" }]}
			/>

			<section className="tasksPageContent">
				<TasksToolbar
					searchQuery={searchQuery}
					onSearchQueryChange={setSearchQuery}
					statusFilters={statusFilters}
					onStatusFilterChange={handleStatusFilterChange}
					onReset={handleReset}
				/>

				<TasksTable
					videos={paginatedVideos}
					selectedIds={selectedIds}
					onSelectedIdsChange={setSelectedIds}
					focusedId={focusedId}
					onFocusedIdChange={setFocusedId}
				/>

				<TasksTablePagination
					totalRows={videos.length}
					selectedCount={selectedIds.size}
					pageIndex={pageIndex}
					pageSize={pageSize}
					onPageIndexChange={setPageIndex}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPageIndex(0);
					}}
				/>

				{videosQuery.error ? (
					<p className="tasksPageError">
						{(videosQuery.error as Error).message}
					</p>
				) : null}
			</section>
		</main>
	);
}
