const DEFAULT_CLIP_GENERATION_CONCURRENCY = 3;

export function resolveClipGenerationConcurrency(): number {
	const raw = process.env.CLIP_GENERATION_CONCURRENCY?.trim();
	if (!raw) {
		return DEFAULT_CLIP_GENERATION_CONCURRENCY;
	}

	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed) || parsed < 1) {
		return DEFAULT_CLIP_GENERATION_CONCURRENCY;
	}

	return parsed;
}
