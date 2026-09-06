export function buildAudioFadeOutFilter(input: {
	durationSeconds: number;
	fadeOutSeconds: number;
}): string | null {
	const { durationSeconds, fadeOutSeconds } = input;
	if (durationSeconds <= 0) {
		return null;
	}

	const fadeDuration = Math.min(fadeOutSeconds, durationSeconds);
	const fadeStart = Math.max(0, durationSeconds - fadeDuration);
	return `afade=t=out:st=${fadeStart}:d=${fadeDuration}`;
}
