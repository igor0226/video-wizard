import { elapsedSeconds } from "./elapsed-seconds";

describe("elapsedSeconds", () => {
	it("floors whole seconds from a monotonic clock", () => {
		expect(elapsedSeconds(1000, 1999)).toBe(0);
		expect(elapsedSeconds(1000, 2000)).toBe(1);
		expect(elapsedSeconds(1000, 12500)).toBe(11);
	});

	it("never goes negative and ignores invalid clocks", () => {
		expect(elapsedSeconds(5000, 1000)).toBe(0);
		expect(elapsedSeconds(Number.NaN, 1000)).toBe(0);
		expect(elapsedSeconds(0, Number.POSITIVE_INFINITY)).toBe(0);
	});
});
