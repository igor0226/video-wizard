import { Injectable, type OnModuleInit } from "@nestjs/common";
import { CronJob } from "cron";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { StaleCallCleanupService } from "./stale-call-cleanup.service";
import {
	isStaleCallCronEnabled,
	resolveStaleCallCronExpression,
} from "./utils/stale-call-config";

@Injectable()
export class StaleCallWorkerService implements OnModuleInit {
	private started = false;
	private tickLock = false;

	constructor(
		@InjectPinoLogger(StaleCallWorkerService.name)
		private readonly logger: PinoLogger,
		private readonly cleanup: StaleCallCleanupService,
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
		this.logger.info(
			{ tickStartedAt: new Date().toISOString() },
			"tick started",
		);

		try {
			await this.cleanup.sweep();
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

		if (!isStaleCallCronEnabled()) {
			this.logger.info("stale call cron disabled via env");
			return;
		}

		const cronExpression = resolveStaleCallCronExpression();
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
