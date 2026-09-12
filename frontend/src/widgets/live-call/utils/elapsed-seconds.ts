export function elapsedSeconds(startedAtMs: number, nowMs: number): number {
	if (!Number.isFinite(startedAtMs) || !Number.isFinite(nowMs)) {
		return 0;
	}
	return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
}
