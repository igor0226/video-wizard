import type {
	ProcessingEventStatus,
	ProcessingStep,
	VideoStatus,
} from "../model/types";

import { AlertCircle, CheckCircle2, Timer } from "lucide-react";

export type TaskStatusLabel = "Completed" | "Processing" | "Queued" | "Failed";

export function getTaskStatusLabel(status: VideoStatus): TaskStatusLabel {
	if (status === "ready") {
		return "Completed";
	}
	if (status === "failed") {
		return "Failed";
	}
	if (status === "pending") {
		return "Queued";
	}
	return "Processing";
}

export function getProcessingStepLabel(step: ProcessingStep): string {
	switch (step) {
		case "queued":
			return "Queued";
		case "audio_extract":
			return "Extracting audio";
		case "transcribing":
			return "Transcribing";
		case "detecting_phrases":
			return "Detecting phrases";
		case "generating_clips":
			return "Generating explanation clips";
		case "composing_video":
			return "Composing video";
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
