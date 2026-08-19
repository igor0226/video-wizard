export const CLIP_GAP_SECONDS = 0.5;

export function computeClipDurationSeconds(ttsDurationSeconds: number): number {
	return ttsDurationSeconds + 2 * CLIP_GAP_SECONDS;
}

export function buildClipAudioFilter(input: {
	gapSeconds: number;
	channels: number;
}): string {
	const delayMs = Math.round(input.gapSeconds * 1000);
	const delaySpec = Array.from({ length: input.channels }, () =>
		String(delayMs),
	).join("|");

	return `adelay=${delaySpec},apad=pad_dur=${input.gapSeconds}`;
}

export function buildClipRenderArgs(input: {
	width: number;
	height: number;
	fps: number;
	durationSeconds: number;
	audioAbsolutePath: string;
	assAbsolutePath: string;
	audioSampleRate: number;
	audioChannels: number;
	outputAbsolutePath: string;
}): string[] {
	const escapedAssPath = input.assAbsolutePath.replace(/'/g, "'\\''");

	return [
		"-y",
		"-f",
		"lavfi",
		"-i",
		`color=c=0x111827:s=${input.width}x${input.height}:r=${input.fps}:d=${input.durationSeconds}`,
		"-i",
		input.audioAbsolutePath,
		"-vf",
		`subtitles='${escapedAssPath}'`,
		"-filter:a",
		buildClipAudioFilter({
			gapSeconds: CLIP_GAP_SECONDS,
			channels: input.audioChannels,
		}),
		"-t",
		String(input.durationSeconds),
		"-c:v",
		"libx264",
		"-preset",
		"veryfast",
		"-crf",
		"23",
		"-pix_fmt",
		"yuv420p",
		"-c:a",
		"aac",
		"-b:a",
		"128k",
		"-ar",
		String(input.audioSampleRate),
		"-ac",
		String(input.audioChannels),
		input.outputAbsolutePath,
	];
}
