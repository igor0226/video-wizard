import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchSpeakingCalls } from "./fetchSpeakingCalls";

describe("fetchSpeakingCalls", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	it("maps history items from the API", async () => {
		vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve([
						{
							id: "call-1",
							status: "ended",
							sourceLanguage: "English",
							languageLevel: "B1",
							explanationLanguage: null,
							createdAt: "2026-08-21T12:00:00.000Z",
							endedAt: "2026-08-21T12:10:00.000Z",
							durationSeconds: 600,
						},
					]),
			}),
		);

		await expect(fetchSpeakingCalls("user-1")).resolves.toEqual([
			expect.objectContaining({
				id: "call-1",
				status: "completed",
				duration: "10:00",
				languageLevel: "B1",
				sourceLanguage: "English",
				explanationLanguage: null,
			}),
		]);
	});

	it("throws when the response is not ok", async () => {
		vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({ ok: false, status: 500 }),
		);

		await expect(fetchSpeakingCalls("user-1")).rejects.toThrow(
			"Failed to load speaking sessions",
		);
	});
});
