import type {
	ProcessingEventStatus,
	ProcessingStep,
	VideoStatus,
} from "../types/video";

import { AlertCircle, CheckCircle2, Timer } from "lucide-react";

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

export function getProcessingStepLabel(step: ProcessingStep): string {
	switch (step) {
		case "queued":
			return "Queued";
		case "audio_extract":
			return "Extracting audio";
		case "transcribing":
			return "Transcribing";
		case "dash_encoding":
			return "Encoding DASH";
		case "completed":
			return "Completed";
		case "failed":
			return "Failed";
	}
}

export function getProcessingEventStatusLabel(
	status: ProcessingEventStatus,
): string {
	switch (status) {
		case "started":
			return "Started";
		case "completed":
			return "Completed";
		case "failed":
			return "Failed";
	}
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
