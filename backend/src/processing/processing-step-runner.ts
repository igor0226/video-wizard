import type { PinoLogger } from "nestjs-pino";

import type { ProcessingHistoryService, ProcessingStep } from "../storage";

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

type StepRunnerDeps = {
	processingHistory: ProcessingHistoryService;
	logger: PinoLogger;
};

export type SkipProcessingStepInput<T> = {
	deps: StepRunnerDeps;
	videoId: string;
	step: ProcessingStep;
	logMessage: string;
	result: T;
};

export type ExecuteProcessingStepInput<T> = {
	deps: StepRunnerDeps;
	videoId: string;
	step: ProcessingStep;
	startLogMessage: string;
	run: () => Promise<T>;
};

export async function skipProcessingStep<T>(
	input: SkipProcessingStepInput<T>,
): Promise<T> {
	const { deps, videoId, step, logMessage, result } = input;
	deps.logger.info({ videoId }, logMessage);
	await deps.processingHistory.recordStepComplete({
		videoId,
		step,
		message: "skipped (already present)",
	});
	return result;
}

export async function executeProcessingStep<T>(
	input: ExecuteProcessingStepInput<T>,
): Promise<T> {
	const { deps, videoId, step, startLogMessage, run } = input;
	deps.logger.info({ videoId }, startLogMessage);
	await deps.processingHistory.recordStepStart(videoId, step);

	try {
		const stepResult = await run();
		await deps.processingHistory.recordStepComplete({ videoId, step });
		return stepResult;
	} catch (error) {
		throw new StepFailedError(step, error);
	}
}
