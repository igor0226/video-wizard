import { describe, expect, it } from "vitest";

import {
	buildLoudnormFilter,
	DEFAULT_INTEGRATED_LUFS,
	parseLoudnormStats,
	resolveTargetIntegratedLufs,
	type LoudnormStats,
} from "./ffmpeg-loudness";

const SAMPLE_STATS: LoudnormStats = {
	input_i: -18.2,
	input_tp: -2.1,
	input_lra: 6.5,
	input_thresh: -28.4,
	target_offset: 1.3,
};

describe("parseLoudnormStats", () => {
	it("extracts loudnorm json from mixed ffmpeg stderr output", () => {
		const stderr = [
			"ffmpeg version 6.0",
			"[Parsed_loudnorm_0 @ 0x123] ",
			JSON.stringify({
				input_i: "-18.20",
				input_tp: "-2.10",
				input_lra: "6.50",
				input_thresh: "-28.40",
				target_offset: "1.30",
			}),
			"video:0kB audio:42kB subtitle:0kB",
		].join("\n");

		expect(parseLoudnormStats(stderr)).toEqual(SAMPLE_STATS);
	});
});

describe("resolveTargetIntegratedLufs", () => {
	it("clamps source integrated loudness to ffmpeg loudnorm range", () => {
		expect(
			resolveTargetIntegratedLufs({ ...SAMPLE_STATS, input_i: -18.2 }),
		).toBe(-18.2);
		expect(resolveTargetIntegratedLufs({ ...SAMPLE_STATS, input_i: -2 })).toBe(
			-5,
		);
		expect(resolveTargetIntegratedLufs({ ...SAMPLE_STATS, input_i: -80 })).toBe(
			-70,
		);
	});
});

describe("buildLoudnormFilter", () => {
	it("builds a two-pass linear loudnorm filter chain", () => {
		expect(
			buildLoudnormFilter({
				targetIntegratedLufs: -18.2,
				measured: SAMPLE_STATS,
			}),
		).toBe(
			"loudnorm=I=-18.2:TP=-1.5:LRA=11:measured_I=-18.2:measured_TP=-2.1:measured_LRA=6.5:measured_thresh=-28.4:offset=1.3:linear=true",
		);
	});
});

describe("DEFAULT_INTEGRATED_LUFS", () => {
	it("uses a speech-friendly fallback target", () => {
		expect(DEFAULT_INTEGRATED_LUFS).toBe(-16);
	});
});
