import type { ProcessingStep, VideoProcessingHistory } from "./types";

const RESUMABLE_STEPS = [
	"audio_extract",
	"transcribing",
	"detecting_phrases",
	"dash_encoding",
] as const satisfies readonly ProcessingStep[];

type ResumableStep = (typeof RESUMABLE_STEPS)[number];

function isResumableStep(step: ProcessingStep): step is ResumableStep {
	return (RESUMABLE_STEPS as readonly ProcessingStep[]).includes(step);
}

export function resolveResumeStep(
	history: VideoProcessingHistory,
): ResumableStep {
	const lastFailed = [...history.events]
		.reverse()
		.find((event) => event.status === "failed" && isResumableStep(event.step));

	if (lastFailed && isResumableStep(lastFailed.step)) {
		return lastFailed.step;
	}

	// for legacy videos without history, we start from the beginning
	return "audio_extract";
}
