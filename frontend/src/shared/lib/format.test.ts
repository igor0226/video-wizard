import { formatBytes, formatTaskId, formatTime } from "./format";

describe("formatTime", () => {
	it("formats seconds as mm:ss", () => {
		expect(formatTime(65)).toBe("01:05");
		expect(formatTime(0)).toBe("00:00");
	});

	it("formats durations over one hour as hh:mm:ss", () => {
		expect(formatTime(3661)).toBe("01:01:01");
	});

	it("returns 00:00 for non-finite values", () => {
		expect(formatTime(Number.NaN)).toBe("00:00");
		expect(formatTime(Number.POSITIVE_INFINITY)).toBe("00:00");
	});
});

describe("formatBytes", () => {
	it("formats bytes without decimals", () => {
		expect(formatBytes(512)).toBe("512 B");
	});

	it("converts to KB and MB with one decimal", () => {
		expect(formatBytes(1536)).toBe("1.5 KB");
		expect(formatBytes(2_621_440)).toBe("2.5 MB");
	});

	it("returns 0 B for zero or negative values", () => {
		expect(formatBytes(0)).toBe("0 B");
		expect(formatBytes(-100)).toBe("0 B");
	});
});

describe("formatTaskId", () => {
	it("strips dashes, uppercases, and keeps first four chars", () => {
		expect(formatTaskId("a1b2-c3d4-e5f6")).toBe("TASK-A1B2");
	});
});
