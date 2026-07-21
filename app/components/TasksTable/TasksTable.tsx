"use client";

import type { VideoItem } from "../../types/video";

import {
	ArrowDown,
	ArrowUp,
	ChevronsUpDown,
	MoreHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../../components/ui/table";
import { cn } from "../../../lib/utils";
import { formatCreatedAt, formatTaskId } from "../../lib/format";
import { getTaskStatusLabel, TaskStatusIcon } from "../../lib/task-status";
import "./TasksTable.css";

type TasksTableProps = {
	videos: VideoItem[];
	selectedIds: Set<string>;
	onSelectedIdsChange: (ids: Set<string>) => void;
	focusedId: string | null;
	onFocusedIdChange: (id: string | null) => void;
};

function SortHeader({ label }: { label: string }) {
	return (
		<div className="tasksSortHeader">
			<span>{label}</span>
			<div className="tasksSortIcons">
				<Button type="button" variant="ghost" size="icon" className="h-6 w-6">
					<ArrowUp className="h-3 w-3" />
				</Button>
				<Button type="button" variant="ghost" size="icon" className="h-6 w-6">
					<ArrowDown className="h-3 w-3" />
				</Button>
				<Button type="button" variant="ghost" size="icon" className="h-6 w-6">
					<ChevronsUpDown className="h-3 w-3" />
				</Button>
			</div>
		</div>
	);
}

export function TasksTable({
	videos,
	selectedIds,
	onSelectedIdsChange,
	focusedId,
	onFocusedIdChange,
}: TasksTableProps) {
	const router = useRouter();
	const allSelected = videos.length > 0 && selectedIds.size === videos.length;
	const someSelected = selectedIds.size > 0 && !allSelected;

	const toggleAll = (checked: boolean) => {
		if (checked) {
			onSelectedIdsChange(new Set(videos.map((video) => video.id)));
			return;
		}
		onSelectedIdsChange(new Set());
	};

	const toggleOne = (videoId: string, checked: boolean) => {
		const next = new Set(selectedIds);
		if (checked) {
			next.add(videoId);
		} else {
			next.delete(videoId);
		}
		onSelectedIdsChange(next);
	};

	return (
		<div className="tasksTableWrap">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-10">
							<Checkbox
								checked={
									allSelected || (someSelected ? "indeterminate" : false)
								}
								onCheckedChange={(checked) => toggleAll(checked === true)}
								aria-label="Select all tasks"
							/>
						</TableHead>
						<TableHead>Task</TableHead>
						<TableHead>Created at</TableHead>
						<TableHead>
							<SortHeader label="Title" />
						</TableHead>
						<TableHead>
							<SortHeader label="Status" />
						</TableHead>
						<TableHead className="w-10" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{videos.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="tasksEmptyCell">
								No tasks yet. Add one to get started.
							</TableCell>
						</TableRow>
					) : (
						videos.map((video) => {
							const isSelected = selectedIds.has(video.id);
							const isFocused = focusedId === video.id;

							return (
								<TableRow
									key={video.id}
									data-state={isSelected ? "selected" : undefined}
									className={cn(
										"tasksTableRow",
										isFocused && "tasksTableRowFocused",
									)}
									onClick={() => {
										onFocusedIdChange(video.id);
										router.push(`/tasks/${video.id}`);
									}}
								>
									<TableCell
										onClick={(event) => event.stopPropagation()}
										onKeyDown={(event) => event.stopPropagation()}
									>
										<Checkbox
											checked={isSelected}
											onCheckedChange={(checked) =>
												toggleOne(video.id, checked === true)
											}
											aria-label={`Select ${video.title}`}
										/>
									</TableCell>
									<TableCell className="font-medium">
										{formatTaskId(video.id)}
									</TableCell>
									<TableCell>{formatCreatedAt(video.createdAt)}</TableCell>
									<TableCell>{video.title}</TableCell>
									<TableCell>
										<div className="tasksStatusCell">
											<TaskStatusIcon
												status={video.status}
												className="h-4 w-4"
											/>
											<span>{getTaskStatusLabel(video.status)}</span>
										</div>
									</TableCell>
									<TableCell
										onClick={(event) => event.stopPropagation()}
										onKeyDown={(event) => event.stopPropagation()}
									>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-8 w-8"
												>
													<MoreHorizontal className="h-4 w-4" />
													<span className="sr-only">Open menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => router.push(`/tasks/${video.id}`)}
												>
													View
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);
}
