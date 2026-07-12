import { CronJob } from "cron";
import { processNextPendingVideo } from "./jobs";

declare global {
	var __videoProcessingWorkerStarted: boolean | undefined;
	var __videoProcessingWorkerLock: boolean | undefined;
}

async function runWorkerTick(): Promise<void> {
	if (globalThis.__videoProcessingWorkerLock) {
		console.info("[video-worker] tick skipped (previous tick still running)");
		return;
	}

	globalThis.__videoProcessingWorkerLock = true;
	const tickStartedAt = new Date().toISOString();
	console.info(`[video-worker] tick started at ${tickStartedAt}`);

	try {
		await processNextPendingVideo();
		console.info(
			`[video-worker] tick completed at ${new Date().toISOString()}`,
		);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unexpected worker error";
		console.error(`[video-worker] tick failed: ${message}`);
	} finally {
		globalThis.__videoProcessingWorkerLock = false;
	}
}

export function ensureProcessingWorkerStarted(): void {
	if (globalThis.__videoProcessingWorkerStarted) {
		console.info("[video-worker] startup skipped (already initialized)");
		return;
	}

	const cronExpression = process.env.VIDEO_PROCESSOR_CRON ?? "*/15 * * * * *";
	console.info(
		`[video-worker] starting cron scheduler with expression "${cronExpression}"`,
	);
	const job = new CronJob(cronExpression, () => {
		void runWorkerTick();
	});

	job.start();
	globalThis.__videoProcessingWorkerStarted = true;
	console.info("[video-worker] scheduler started");

	// Run one immediate scan so the user does not always wait up to 15 seconds.
	console.info("[video-worker] running immediate startup tick");
	void runWorkerTick();
}
