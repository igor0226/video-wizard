"use client";

import type { Ref } from "react";
import type { StatusFilterKey } from "@/features/filter-tasks";

import { CirclePlus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import "./TasksToolbar.css";

type TasksToolbarProps = {
	searchQuery: string;
	searchInputRef?: Ref<HTMLInputElement>;
	onSearchQueryChange: (value: string) => void;
	statusFilters: Record<StatusFilterKey, boolean>;
	onStatusFilterChange: (key: StatusFilterKey, checked: boolean) => void;
	onReset: () => void;
};

const STATUS_FILTER_OPTIONS: { key: StatusFilterKey; label: string }[] = [
	{ key: "completed", label: "Completed" },
	{ key: "inProgress", label: "Processing" },
	{ key: "failed", label: "Failed" },
];

export function TasksToolbar({
	searchQuery,
	searchInputRef,
	onSearchQueryChange,
	statusFilters,
	onStatusFilterChange,
	onReset,
}: TasksToolbarProps) {
	return (
		<div className="tasksToolbar">
			<div className="tasksToolbarFilters">
				<div className="tasksSearchInput">
					<Search className="tasksSearchIcon" aria-hidden />
					<Input
						ref={searchInputRef}
						type="search"
						value={searchQuery}
						onChange={(event) => onSearchQueryChange(event.target.value)}
						placeholder="Filter tasks..."
						aria-label="Filter tasks"
						className="tasksSearchField"
					/>
				</div>

				<Popover>
					<PopoverTrigger asChild>
						<Button variant="outline" className="tasksStatusButton">
							<CirclePlus className="h-4 w-4" />
							Status
						</Button>
					</PopoverTrigger>
					<PopoverContent align="start" className="tasksStatusPopover">
						<div className="tasksStatusOptions">
							{STATUS_FILTER_OPTIONS.map((option) => (
								<div key={option.key} className="tasksStatusOption">
									<Checkbox
										id={`status-${option.key}`}
										checked={statusFilters[option.key]}
										onCheckedChange={(checked) =>
											onStatusFilterChange(option.key, checked === true)
										}
									/>
									<Label htmlFor={`status-${option.key}`}>{option.label}</Label>
								</div>
							))}
						</div>
					</PopoverContent>
				</Popover>

				<Button variant="ghost" type="button" onClick={onReset}>
					Reset
				</Button>
			</div>

			<Button asChild>
				<Link href="/listening/upload">+ Add Task</Link>
			</Button>
		</div>
	);
}
