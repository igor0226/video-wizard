"use client";

import type { RefObject } from "react";

import { useEffect, useMemo, useRef, useState } from "react";

import { useVideos } from "@/entities/video";
import {
	DEFAULT_STATUS_FILTERS,
	matchesVideoQuery,
	matchesVideoStatus,
	type StatusFilterKey,
} from "@/features/filter-tasks";
import {
	TasksTable,
	TasksTablePagination,
	TasksToolbar,
} from "@/widgets/listening-library";
import { AppPageHeader } from "@/widgets/page-header";

export default function ListeningLibraryPage() {
	const searchRef = useRef<HTMLInputElement>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilters, setStatusFilters] = useState(DEFAULT_STATUS_FILTERS);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [focusedId, setFocusedId] = useState<string | null>(null);
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(10);

	const { videos, error: videosError } = useVideos();
	const filteredVideos = useMemo(
		() =>
			videos.filter(
				(video) =>
					matchesVideoQuery(video, searchQuery) &&
					matchesVideoStatus(video, statusFilters),
			),
		[searchQuery, statusFilters, videos],
	);

	const paginatedVideos = useMemo(() => {
		const start = pageIndex * pageSize;
		return filteredVideos.slice(start, start + pageSize);
	}, [filteredVideos, pageIndex, pageSize]);

	useEffect(() => {
		const pageCount = Math.max(1, Math.ceil(filteredVideos.length / pageSize));
		if (pageIndex > pageCount - 1) {
			setPageIndex(Math.max(0, pageCount - 1));
		}
	}, [filteredVideos.length, pageIndex, pageSize]);

	useFocusSearchShortcut(searchRef);

	return (
		<main className="tasksPage">
			<AppPageHeader
				title="Listening"
				breadcrumbs={[
					{ label: "Home", href: "/dashboard" },
					{ label: "Tasks" },
				]}
			/>

			<section className="tasksPageContent">
				<TasksToolbar
					searchQuery={searchQuery}
					searchInputRef={searchRef}
					onSearchQueryChange={setSearchQuery}
					statusFilters={statusFilters}
					onStatusFilterChange={(key: StatusFilterKey, checked) => {
						setStatusFilters((previous) => ({ ...previous, [key]: checked }));
					}}
					onReset={() => {
						setSearchQuery("");
						setStatusFilters(DEFAULT_STATUS_FILTERS);
						setSelectedIds(new Set());
					}}
				/>

				<TasksTable
					videos={paginatedVideos}
					selectedIds={selectedIds}
					onSelectedIdsChange={setSelectedIds}
					focusedId={focusedId}
					onFocusedIdChange={setFocusedId}
					emptyLabel={
						videos.length === 0
							? "No tasks yet. Add one to get started."
							: "No tasks found matching your filter criteria."
					}
				/>

				<TasksTablePagination
					totalRows={filteredVideos.length}
					selectedCount={selectedIds.size}
					pageIndex={pageIndex}
					pageSize={pageSize}
					onPageIndexChange={setPageIndex}
					onPageSizeChange={(nextPageSize) => {
						setPageSize(nextPageSize);
						setPageIndex(0);
					}}
				/>

				{videosError ? (
					<p className="tasksPageError">{(videosError as Error).message}</p>
				) : null}
			</section>
		</main>
	);
}

function useFocusSearchShortcut(searchRef: RefObject<HTMLInputElement | null>) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "/" || event.metaKey || event.ctrlKey) {
				return;
			}
			const target = event.target as HTMLElement | null;
			if (target?.closest("input, textarea, select")) {
				return;
			}
			event.preventDefault();
			searchRef.current?.focus();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [searchRef]);
}
