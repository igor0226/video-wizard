"use client";

import { CirclePlus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../../../components/ui/popover";
import "./TasksToolbar.css";

export type StatusFilterKey = "completed" | "inProgress" | "failed";

type TasksToolbarProps = {
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
	statusFilters: Record<StatusFilterKey, boolean>;
	onStatusFilterChange: (key: StatusFilterKey, checked: boolean) => void;
	onReset: () => void;
};

const STATUS_FILTER_OPTIONS: { key: StatusFilterKey; label: string }[] = [
	{ key: "completed", label: "Completed" },
	{ key: "inProgress", label: "In Progress" },
	{ key: "failed", label: "Failed" },
];

export function TasksToolbar({
	searchQuery,
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
						type="search"
						value={searchQuery}
						onChange={(event) => onSearchQueryChange(event.target.value)}
						placeholder="Filter tasks..."
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
				<Link href="/tasks/new">+ Add Task</Link>
			</Button>
		</div>
	);
}
