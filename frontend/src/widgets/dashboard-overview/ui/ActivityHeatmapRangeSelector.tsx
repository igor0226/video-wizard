import { Button } from "@/shared/ui/button";

export type ActivityHeatmapDateRange = "30d" | "3m" | "1y";

type ActivityHeatmapRangeSelectorProps = {
	dateRange: ActivityHeatmapDateRange;
	onChange: (range: ActivityHeatmapDateRange) => void;
};

export function ActivityHeatmapRangeSelector({
	dateRange,
	onChange,
}: ActivityHeatmapRangeSelectorProps) {
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
