import { afterEach, describe, expect, it, vi } from "vitest";

import { mapCallHistoryItem } from "./map-call-history-item";

describe("mapCallHistoryItem", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("maps ended calls to completed rows", () => {
		expect(
			mapCallHistoryItem({
				id: "call-1",
				status: "ended",
				sourceLanguage: "English",
				languageLevel: "B1",
				explanationLanguage: null,
				createdAt: "2026-08-21T12:00:00.000Z",
				endedAt: "2026-08-21T12:14:20.000Z",
				durationSeconds: 860,
			}),
		).toEqual({
			id: "call-1",
			callId: "call-1",
			date: expect.any(String),
			duration: "14:20",
			durationSeconds: 860,
			status: "completed",
			languageLevel: "B1",
			sourceLanguage: "English",
			explanationLanguage: null,
		});
	});

	it("uses a dash when duration is unknown", () => {
		expect(
			mapCallHistoryItem({
				id: "call-2",
				status: "active",
				sourceLanguage: "English",
				languageLevel: "A2",
				explanationLanguage: null,
				createdAt: "2026-08-21T12:00:00.000Z",
				endedAt: null,
				durationSeconds: null,
			}),
		).toMatchObject({
			duration: "—",
			durationSeconds: 0,
			status: "in_progress",
			languageLevel: "A2",
			sourceLanguage: "English",
			explanationLanguage: null,
		});
	});
});
