import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StaleCallWorkerService } from "./stale-call-worker.service";

const { start, cronJob } = vi.hoisted(() => ({
	start: vi.fn(),
	cronJob: vi.fn(),
}));

vi.mock("cron", () => ({
	CronJob: class {
		constructor(expression: string, onTick: () => void) {
			cronJob(expression, onTick);
		}

		start() {
			start();
		}
	},
}));

describe("StaleCallWorkerService", () => {
	const logger = { info: vi.fn(), error: vi.fn() };
	const cleanup = { sweep: vi.fn(async () => undefined) };
	const previousEnabled = process.env.SPEAKING_STALE_CALL_CRON_ENABLED;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		if (previousEnabled === undefined) {
			delete process.env.SPEAKING_STALE_CALL_CRON_ENABLED;
			return;
		}
		process.env.SPEAKING_STALE_CALL_CRON_ENABLED = previousEnabled;
	});

	it("does not start when cron env is not true", () => {
		process.env.SPEAKING_STALE_CALL_CRON_ENABLED = "false";
		const worker = new StaleCallWorkerService(
			logger as never,
			cleanup as never,
		);
		worker.onModuleInit();
		expect(cronJob).not.toHaveBeenCalled();
		expect(cleanup.sweep).not.toHaveBeenCalled();
	});

	it("starts the scheduler when cron env is true", async () => {
		process.env.SPEAKING_STALE_CALL_CRON_ENABLED = "true";
		const worker = new StaleCallWorkerService(
			logger as never,
			cleanup as never,
		);
		worker.onModuleInit();
		expect(cronJob).toHaveBeenCalled();
		expect(start).toHaveBeenCalled();
		await vi.waitFor(() => expect(cleanup.sweep).toHaveBeenCalled());
	});
});
