import { afterEach, describe, expect, it, vi } from "vitest";

import { createDebouncedRunner } from "./debounce";

describe("createDebouncedRunner", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("runs only the latest scheduled task after the delay", () => {
		vi.useFakeTimers();
		const { schedule } = createDebouncedRunner(200);
		const first = vi.fn();
		const second = vi.fn();
		schedule(first);
		schedule(second);
		vi.advanceTimersByTime(200);
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it("cancel prevents a pending task from running", () => {
		vi.useFakeTimers();
		const { schedule, cancel } = createDebouncedRunner(200);
		const task = vi.fn();
		schedule(task);
		cancel();
		vi.advanceTimersByTime(200);
		expect(task).not.toHaveBeenCalled();
	});
});
