import {
	normalizeFfmpegError,
	runProcessWithStderr,
} from "./ffmpeg-process";

export const DEFAULT_INTEGRATED_LUFS = -16;
const MIN_INTEGRATED_LUFS = -70;
const MAX_INTEGRATED_LUFS = -5;

export type LoudnormStats = {
	input_i: number;
	input_tp: number;
	input_lra: number;
	input_thresh: number;
	target_offset: number;
};

type LoudnormJson = {
	input_i?: string | number;
	input_tp?: string | number;
	input_lra?: string | number;
	input_thresh?: string | number;
	target_offset?: string | number;
};

function parseLoudnormNumber(value: string | number | undefined): number | null {
	if (value === undefined) {
		return null;
	}

	const parsed =
		typeof value === "number" ? value : Number.parseFloat(String(value).trim());
	if (!Number.isFinite(parsed)) {
		return null;
	}

	return parsed;
}

export function parseLoudnormStats(stderr: string): LoudnormStats {
	const jsonMatch = stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/);
	if (!jsonMatch) {
		throw new Error("loudnorm stats not found in ffmpeg output");
	}

	const parsed = JSON.parse(jsonMatch[0]) as LoudnormJson;
	const input_i = parseLoudnormNumber(parsed.input_i);
	const input_tp = parseLoudnormNumber(parsed.input_tp);
	const input_lra = parseLoudnormNumber(parsed.input_lra);
	const input_thresh = parseLoudnormNumber(parsed.input_thresh);
	const target_offset = parseLoudnormNumber(parsed.target_offset);

	if (
		input_i === null ||
		input_tp === null ||
		input_lra === null ||
		input_thresh === null ||
		target_offset === null
	) {
		throw new Error("loudnorm stats are incomplete");
	}

	return {
		input_i,
		input_tp,
		input_lra,
		input_thresh,
		target_offset,
	};
}

export function resolveTargetIntegratedLufs(stats: LoudnormStats): number {
	if (!Number.isFinite(stats.input_i)) {
		return DEFAULT_INTEGRATED_LUFS;
	}

	return Math.min(
		MAX_INTEGRATED_LUFS,
		Math.max(MIN_INTEGRATED_LUFS, stats.input_i),
	);
}

export async function probeLoudnormStats(
	absolutePath: string,
): Promise<LoudnormStats> {
	try {
		const stderr = await runProcessWithStderr("ffmpeg", [
			"-hide_banner",
			"-i",
			absolutePath,
			"-af",
			"loudnorm=print_format=json",
			"-f",
			"null",
			"-",
		]);
		return parseLoudnormStats(stderr);
	} catch (error) {
		throw normalizeFfmpegError(error);
	}
}

export function buildLoudnormFilter(input: {
	targetIntegratedLufs: number;
	measured: LoudnormStats;
}): string {
	const { targetIntegratedLufs, measured } = input;

	return [
		`loudnorm=I=${targetIntegratedLufs}`,
		"TP=-1.5",
		"LRA=11",
		`measured_I=${measured.input_i}`,
		`measured_TP=${measured.input_tp}`,
		`measured_LRA=${measured.input_lra}`,
		`measured_thresh=${measured.input_thresh}`,
		`offset=${measured.target_offset}`,
		"linear=true",
	].join(":");
}
