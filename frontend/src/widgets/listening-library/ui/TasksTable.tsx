"use client";

import type { VideoItem } from "@/entities/video";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import {
	getProcessingStepLabel,
	getTaskStatusLabel,
	TaskStatusIcon,
} from "@/entities/video";
import { cn, formatCreatedAt, formatTaskId } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import { TasksSortHeader } from "./TasksSortHeader";
import "./TasksTable.css";

type TasksTableProps = {
	videos: VideoItem[];
	selectedIds: Set<string>;
	onSelectedIdsChange: (ids: Set<string>) => void;
	focusedId: string | null;
	onFocusedIdChange: (id: string | null) => void;
	emptyLabel?: string;
};

export function TasksTable({
	videos,
	selectedIds,
	onSelectedIdsChange,
	focusedId,
	onFocusedIdChange,
	emptyLabel = "No tasks yet. Add one to get started.",
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
							<TasksSortHeader label="Title" />
						</TableHead>
						<TableHead>
							<TasksSortHeader label="Status" />
						</TableHead>
						<TableHead className="w-10" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{videos.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="tasksEmptyCell">
								{emptyLabel}
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
										router.push(`/listening/${video.id}`);
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
											<div className="tasksStatusText">
												<span>{getTaskStatusLabel(video.status)}</span>
												{video.status === "pending" ||
												video.status === "processing" ? (
													<span className="tasksStatusDetail">
														{getProcessingStepLabel(video.processingStep)}
														{video.queuePosition != null
															? ` · Queue #${video.queuePosition}`
															: null}
													</span>
												) : null}
											</div>
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
													onClick={() => router.push(`/listening/${video.id}`)}
												>
													View Details
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={async () => {
														await navigator.clipboard.writeText(video.id);
													}}
												>
													Copy Task ID
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
