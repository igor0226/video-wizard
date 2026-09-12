import type { ActivityHeatmapEntry } from "@/entities/practice";

import { focusAdjacentButton } from "@/shared/lib";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type HeatmapCellProps = {
	entry: ActivityHeatmapEntry;
};

export function HeatmapCell({ entry }: HeatmapCellProps) {
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
