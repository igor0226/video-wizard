import { CronJob } from "cron";

import { processNextPendingVideo } from "./jobs";

declare global {
	var __videoProcessingWorkerStarted: boolean | undefined;
	var __videoProcessingWorkerLock: boolean | undefined;
}

async function runWorkerTick(): Promise<void> {
	if (globalThis.__videoProcessingWorkerLock) {
		// biome-ignore lint: noConsole
		console.info("[video-worker] tick skipped (previous tick still running)");
		return;
	}

	globalThis.__videoProcessingWorkerLock = true;
	const tickStartedAt = new Date().toISOString();
	// biome-ignore lint: noConsole
	console.info(`[video-worker] tick started at ${tickStartedAt}`);

	try {
		await processNextPendingVideo();
		// biome-ignore lint: noConsole
		console.info(
			`[video-worker] tick completed at ${new Date().toISOString()}`,
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unexpected worker error";
		// biome-ignore lint: noConsole
		console.error(`[video-worker] tick failed: ${message}`);
	} finally {
		globalThis.__videoProcessingWorkerLock = false;
	}
}

export function ensureProcessingWorkerStarted(): void {
	if (globalThis.__videoProcessingWorkerStarted) {
		// biome-ignore lint: noConsole
		console.info("[video-worker] startup skipped (already initialized)");
		return;
	}

	const cronExpression = process.env.VIDEO_PROCESSOR_CRON ?? "*/15 * * * * *";
	// biome-ignore lint: noConsole
	console.info(
		`[video-worker] starting cron scheduler with expression "${cronExpression}"`,
	);
	const job = new CronJob(cronExpression, () => {
		void runWorkerTick();
	});

	job.start();
	globalThis.__videoProcessingWorkerStarted = true;
	// biome-ignore lint: noConsole
	console.info("[video-worker] scheduler started");

	// Run one immediate scan so the user does not always wait up to 15 seconds.
	// biome-ignore lint: noConsole
	console.info("[video-worker] running immediate startup tick");
	void runWorkerTick();
}
