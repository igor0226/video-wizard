import type { RecentActivity } from "@/entities/practice";

import { ChevronRight, Headphones, Mic } from "lucide-react";

import { Badge } from "@/shared/ui/badge";

type ActivityRowProps = {
	item: RecentActivity;
};

export function ActivityRow({ item }: ActivityRowProps) {
	return (
		<>
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
					{item.mode === "listening" ? (
						<Headphones className="h-4 w-4" />
					) : (
						<Mic className="h-4 w-4" />
					)}
				</div>
				<div>
					<div className="text-sm font-medium">{item.title}</div>
					<div className="mt-0.5 font-mono text-xs text-muted-foreground">
						{item.taskId} · {item.date} · {item.duration}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<Badge variant="secondary">{item.status}</Badge>
				<ChevronRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</>
	);
}
