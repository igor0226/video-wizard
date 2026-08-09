import { Injectable, type OnModuleInit } from "@nestjs/common";
import { CronJob } from "cron";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { JobsService } from "./jobs.service";

@Injectable()
export class ProcessingWorkerService implements OnModuleInit {
	private started = false;
	private tickLock = false;

	constructor(
		@InjectPinoLogger(ProcessingWorkerService.name)
		private readonly logger: PinoLogger,
		private readonly jobsService: JobsService,
	) {}

	onModuleInit(): void {
		this.ensureStarted();
	}

	private async runWorkerTick(): Promise<void> {
		if (this.tickLock) {
			this.logger.info("tick skipped (previous tick still running)");
			return;
		}

		this.tickLock = true;
		const tickStartedAt = new Date().toISOString();
		this.logger.info({ tickStartedAt }, "tick started");

		try {
			await this.jobsService.processNextPendingVideo();
			this.logger.info(
				{ completedAt: new Date().toISOString() },
				"tick completed",
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unexpected worker error";
			this.logger.error({ err: message }, "tick failed");
		} finally {
			this.tickLock = false;
		}
	}

	private ensureStarted(): void {
		if (this.started) {
			this.logger.info("startup skipped (already initialized)");
			return;
		}

		if (process.env.VIDEO_PROCESSING_CRON_ENABLED !== "true") {
			this.logger.info("processing cron disabled via env");
			return;
		}

		const cronExpression = process.env.VIDEO_PROCESSOR_CRON ?? "*/15 * * * * *";
		this.logger.info({ cronExpression }, "starting cron scheduler");
		const job = new CronJob(cronExpression, () => {
			void this.runWorkerTick();
		});

		job.start();
		this.started = true;
		this.logger.info("scheduler started");
		this.logger.info("running immediate startup tick");
		void this.runWorkerTick();
	}
}
