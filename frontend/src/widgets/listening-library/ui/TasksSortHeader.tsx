import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { Button } from "@/shared/ui/button";

type TasksSortHeaderProps = {
	label: string;
};

export function TasksSortHeader({ label }: TasksSortHeaderProps) {
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
