import { describe, expect, it } from "vitest";

import type { TeacherCallRecord } from "../../storage/types";
import { toCallHistoryItem } from "./to-call-history-item";

function makeRecord(
	overrides: Partial<TeacherCallRecord> = {},
): TeacherCallRecord {
	return {
		id: "call-1",
		userId: "user-1",
		roomName: "teacher-call-1",
		status: "ended",
		sourceLanguage: "English",
		languageLevel: "B1",
		explanationLanguage: null,
		agentDispatchId: "disp-1",
		endedReason: "user_ended",
		createdAt: "2026-01-01T00:00:00.000Z",
		endedAt: "2026-01-01T00:10:00.000Z",
		...overrides,
	};
}

describe("toCallHistoryItem", () => {
	it("projects list fields and duration without topic or fluency", () => {
		const item = toCallHistoryItem(makeRecord());
		expect(item).toEqual({
			id: "call-1",
			status: "ended",
			sourceLanguage: "English",
			languageLevel: "B1",
			explanationLanguage: null,
			createdAt: "2026-01-01T00:00:00.000Z",
			endedAt: "2026-01-01T00:10:00.000Z",
			durationSeconds: 600,
		});
		expect(item).not.toHaveProperty("topic");
		expect(item).not.toHaveProperty("fluencyScore");
		expect(item).not.toHaveProperty("roomName");
	});

	it("returns null duration while the call is still active", () => {
		expect(
			toCallHistoryItem(makeRecord({ status: "active", endedAt: null }))
				.durationSeconds,
		).toBeNull();
	});
});
