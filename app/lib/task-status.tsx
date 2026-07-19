import { AlertCircle, CheckCircle2, Timer } from "lucide-react";
import type { VideoStatus } from "../types/video";

export type TaskStatusLabel = "Completed" | "In Progress" | "Failed";

export function getTaskStatusLabel(status: VideoStatus): TaskStatusLabel {
	if (status === "ready") {
		return "Completed";
	}
	if (status === "failed") {
		return "Failed";
	}
	return "In Progress";
}

export function TaskStatusIcon({
	status,
	className,
}: {
	status: VideoStatus;
	className?: string;
}) {
	const label = getTaskStatusLabel(status);

	if (label === "Completed") {
		return <CheckCircle2 className={className} aria-hidden />;
	}
	if (label === "Failed") {
		return <AlertCircle className={className} aria-hidden />;
	}
	return <Timer className={className} aria-hidden />;
}
