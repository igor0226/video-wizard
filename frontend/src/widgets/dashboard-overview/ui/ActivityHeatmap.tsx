"use client";

import type { ActivityHeatmapEntry } from "@/entities/practice";

import { Calendar } from "lucide-react";
import { useState } from "react";

import { focusAdjacentButton } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type DateRange = "30d" | "3m" | "1y";

type ActivityHeatmapProps = {
	entries: ActivityHeatmapEntry[];
	streakDays: number;
};

export function ActivityHeatmap({ entries, streakDays }: ActivityHeatmapProps) {
	const [dateRange, setDateRange] = useState<DateRange>("30d");

	return (
		<Card>
			<CardContent className="space-y-6 p-6">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="h-4 w-4" aria-hidden />
							<h2 className="text-sm font-semibold uppercase tracking-wider">
								Practice Consistency
							</h2>
						</div>
						<p className="mt-1 text-2xl font-bold">{streakDays} Day Streak</p>
					</div>
					<RangeSelector dateRange={dateRange} onChange={setDateRange} />
				</div>
				<HeatmapGrid entries={entries} />
			</CardContent>
		</Card>
	);
}

function RangeSelector({
	dateRange,
	onChange,
}: {
	dateRange: DateRange;
	onChange: (range: DateRange) => void;
}) {
	return (
		<div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
			{(["30d", "3m", "1y"] as const).map((range) => (
				<Button
					key={range}
					type="button"
					variant={dateRange === range ? "secondary" : "ghost"}
					size="sm"
					onClick={() => onChange(range)}
				>
					{range.toUpperCase()}
				</Button>
			))}
		</div>
	);
}

function HeatmapGrid({ entries }: { entries: ActivityHeatmapEntry[] }) {
	return (
		<div className="overflow-x-auto pb-2">
			<div className="dashboardHeatmapGrid">
				{entries.map((entry) => (
					<HeatmapCell key={entry.date} entry={entry} />
				))}
			</div>
		</div>
	);
}

function HeatmapCell({ entry }: { entry: ActivityHeatmapEntry }) {
	const label = `${entry.date}: ${entry.value} minutes practiced`;
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					className={`h-8 w-full rounded-md heatmapCell-${entry.intensity}`}
					aria-label={label}
					onKeyDown={(event) => {
						if (event.key === "ArrowRight") {
							focusAdjacentButton(event.currentTarget, "next");
						}
						if (event.key === "ArrowLeft") {
							focusAdjacentButton(event.currentTarget, "previous");
						}
					}}
				>
					<span className="sr-only">{label}</span>
				</button>
			</TooltipTrigger>
			<TooltipContent>
				{entry.date}: {entry.value} minutes logged
			</TooltipContent>
		</Tooltip>
	);
}
