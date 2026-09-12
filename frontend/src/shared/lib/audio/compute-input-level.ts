const CENTER = 128;
const AMPLITUDE = 128;
const DISPLAY_GAIN = 160;

export function computeInputLevel(samples: Uint8Array): number {
	if (samples.length === 0) {
		return 0;
	}

	let sumSquares = 0;
	for (const sample of samples) {
		const amplitude = (sample - CENTER) / AMPLITUDE;
		sumSquares += amplitude * amplitude;
	}

	const rms = Math.sqrt(sumSquares / samples.length);
	return Math.min(100, Math.round(rms * DISPLAY_GAIN));
}
