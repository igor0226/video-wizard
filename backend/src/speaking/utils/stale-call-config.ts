export const STALE_CALL_ENDED_REASON = "stale_room_missing";
export const DEFAULT_STALE_CALL_GRACE_SECONDS = 120;
export const DEFAULT_STALE_CALL_CRON = "0 * * * * *";

export function resolveStaleCallGraceSeconds(): number {
	const parsed = Number(
		process.env.SPEAKING_STALE_CALL_GRACE_SECONDS ??
			DEFAULT_STALE_CALL_GRACE_SECONDS,
	);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return DEFAULT_STALE_CALL_GRACE_SECONDS;
	}
	return parsed;
}

export function staleCallCutoffIso(now = new Date()): string {
	const graceMs = resolveStaleCallGraceSeconds() * 1000;
	return new Date(now.getTime() - graceMs).toISOString();
}

export function isStaleCallCronEnabled(): boolean {
	return process.env.SPEAKING_STALE_CALL_CRON_ENABLED === "true";
}

export function resolveStaleCallCronExpression(): string {
	return process.env.SPEAKING_STALE_CALL_CRON ?? DEFAULT_STALE_CALL_CRON;
}
