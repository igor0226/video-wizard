"use client";

import type { ActivityHeatmapEntry } from "@/entities/practice";

import { Calendar } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/shared/ui/card";
import {
	type ActivityHeatmapDateRange,
	ActivityHeatmapRangeSelector,
} from "./ActivityHeatmapRangeSelector";
import { HeatmapGrid } from "./HeatmapGrid";

type ActivityHeatmapProps = {
	entries: ActivityHeatmapEntry[];
	streakDays: number;
};

export function ActivityHeatmap({ entries, streakDays }: ActivityHeatmapProps) {
	const [dateRange, setDateRange] = useState<ActivityHeatmapDateRange>("30d");

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
					<ActivityHeatmapRangeSelector
						dateRange={dateRange}
						onChange={setDateRange}
					/>
				</div>
				<HeatmapGrid entries={entries} />
			</CardContent>
		</Card>
	);
}
