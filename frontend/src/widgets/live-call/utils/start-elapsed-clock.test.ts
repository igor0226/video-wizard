import { startElapsedClock } from "./start-elapsed-clock";

describe("startElapsedClock", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("reports elapsed time from the start mark, not tick count", () => {
		vi.useFakeTimers();
		const onSeconds = vi.fn();
		let nowMs = 10_000;
		const stop = startElapsedClock(10_000, () => nowMs, onSeconds);

		expect(onSeconds).toHaveBeenLastCalledWith(0);

		nowMs = 14_250;
		vi.advanceTimersByTime(1000);
		expect(onSeconds).toHaveBeenLastCalledWith(4);

		nowMs = 22_000;
		document.dispatchEvent(new Event("visibilitychange"));
		expect(onSeconds).toHaveBeenLastCalledWith(12);

		stop();
		nowMs = 30_000;
		vi.advanceTimersByTime(1000);
		document.dispatchEvent(new Event("visibilitychange"));
		expect(onSeconds).toHaveBeenLastCalledWith(12);
	});
});
