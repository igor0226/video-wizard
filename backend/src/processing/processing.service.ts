import { Injectable, type OnModuleInit } from "@nestjs/common";
import { CronJob } from "cron";

import { processNextPendingVideo } from "./jobs";

@Injectable()
export class ProcessingWorkerService implements OnModuleInit {
	private started = false;
	private tickLock = false;

	onModuleInit(): void {
		this.ensureStarted();
	}

	private async runWorkerTick(): Promise<void> {
		if (this.tickLock) {
			console.info("[video-worker] tick skipped (previous tick still running)");
			return;
		}

		this.tickLock = true;
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
			this.tickLock = false;
		}
	}

	private ensureStarted(): void {
		if (this.started) {
			console.info("[video-worker] startup skipped (already initialized)");
			return;
		}

		const cronExpression = process.env.VIDEO_PROCESSOR_CRON ?? "*/15 * * * * *";
		console.info(
			`[video-worker] starting cron scheduler with expression "${cronExpression}"`,
		);
		const job = new CronJob(cronExpression, () => {
			void this.runWorkerTick();
		});

		job.start();
		this.started = true;
		console.info("[video-worker] scheduler started");
		console.info("[video-worker] running immediate startup tick");
		void this.runWorkerTick();
	}
}
