import type { ActivityHeatmapEntry } from "@/entities/practice";

import { HeatmapCell } from "./HeatmapCell";

type HeatmapGridProps = {
	entries: ActivityHeatmapEntry[];
};

export function HeatmapGrid({ entries }: HeatmapGridProps) {
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
