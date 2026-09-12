import { computeInputLevel } from "./compute-input-level";

describe("computeInputLevel", () => {
	it("returns 0 for an empty buffer", () => {
		expect(computeInputLevel(new Uint8Array())).toBe(0);
	});

	it("returns 0 for silence", () => {
		expect(computeInputLevel(new Uint8Array(8).fill(128))).toBe(0);
	});

	it("returns a high level for a loud waveform", () => {
		const samples = new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]);
		expect(computeInputLevel(samples)).toBe(100);
	});

	it("returns a mid level for a quieter waveform", () => {
		const samples = new Uint8Array(8).fill(148);
		expect(computeInputLevel(samples)).toBeGreaterThan(0);
		expect(computeInputLevel(samples)).toBeLessThan(50);
	});
});
