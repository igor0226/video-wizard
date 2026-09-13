import { afterEach, describe, expect, it } from "vitest";

import {
	DEFAULT_STALE_CALL_GRACE_SECONDS,
	resolveStaleCallGraceSeconds,
	staleCallCutoffIso,
} from "./stale-call-config";

describe("stale-call-config", () => {
	const previousGrace = process.env.SPEAKING_STALE_CALL_GRACE_SECONDS;

	afterEach(() => {
		if (previousGrace === undefined) {
			delete process.env.SPEAKING_STALE_CALL_GRACE_SECONDS;
			return;
		}
		process.env.SPEAKING_STALE_CALL_GRACE_SECONDS = previousGrace;
	});

	it("uses the default grace when env is missing", () => {
		delete process.env.SPEAKING_STALE_CALL_GRACE_SECONDS;
		expect(resolveStaleCallGraceSeconds()).toBe(
			DEFAULT_STALE_CALL_GRACE_SECONDS,
		);
	});

	it("computes a cutoff from the grace period", () => {
		process.env.SPEAKING_STALE_CALL_GRACE_SECONDS = "60";
		const now = new Date("2026-01-01T00:02:00.000Z");
		expect(staleCallCutoffIso(now)).toBe("2026-01-01T00:01:00.000Z");
	});
});
