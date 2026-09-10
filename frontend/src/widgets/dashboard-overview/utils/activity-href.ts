import type { RecentActivity } from "@/entities/practice";

export function activityHref(item: RecentActivity): string {
	if (item.mode === "speaking") {
		return "/speaking";
	}
	return `/listening/${item.taskId}`;
}
