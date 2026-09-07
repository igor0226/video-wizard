import type { ProcessingStep } from "../../storage";

export class StepFailedError extends Error {
	constructor(
		readonly step: ProcessingStep,
		cause: unknown,
	) {
		super(normalizeFailureMessage(cause));
		this.name = "StepFailedError";
	}
}

export function normalizeFailureMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message.slice(0, 400);
	}
	return "Unexpected processing error";
}

export function getFailedStep(error: unknown): ProcessingStep {
	if (error instanceof StepFailedError) {
		return error.step;
	}
	return "audio_extract";
}
