import type { HistoryFilter } from "../utils/matches-call-history-filter";

import { Button } from "@/shared/ui/button";

type CallHistoryFilterChipsProps = {
	filter: HistoryFilter;
	onChange: (filter: HistoryFilter) => void;
};

export function CallHistoryFilterChips({
	filter,
	onChange,
}: CallHistoryFilterChipsProps) {
	const chips: Array<{ id: HistoryFilter; label: string }> = [
		{ id: "all", label: "All" },
		{ id: "completed", label: "Completed" },
		{ id: "under10", label: "Under 10 mins" },
		{ id: "over10", label: "Over 10 mins" },
	];

	return (
		<div className="flex flex-wrap gap-2">
			{chips.map((chip) => (
				<Button
					key={chip.id}
					type="button"
					size="sm"
					variant={filter === chip.id ? "default" : "outline"}
					onClick={() => onChange(chip.id)}
				>
					{chip.label}
				</Button>
			))}
		</div>
	);
}
