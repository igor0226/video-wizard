import { describe, expect, it } from "vitest";

import type { TeacherCallRecord } from "../../storage/types";
import { serializeCallDispatchMetadata } from "./dispatch-metadata";

const call: TeacherCallRecord = {
	id: "call-1",
	userId: "user-1",
	roomName: "teacher-call-1",
	status: "active",
	sourceLanguage: "English",
	languageLevel: "B1",
	explanationLanguage: "Spanish",
	agentDispatchId: null,
	endedReason: null,
	createdAt: "2026-01-01T00:00:00.000Z",
	endedAt: null,
};

describe("serializeCallDispatchMetadata", () => {
	it("omits topic when it is missing or blank", () => {
		expect(JSON.parse(serializeCallDispatchMetadata({ call }))).toEqual({
			callId: "call-1",
			sourceLanguage: "English",
			languageLevel: "B1",
			explanationLanguage: "Spanish",
		});
		expect(
			JSON.parse(serializeCallDispatchMetadata({ call, topic: "   " })),
		).not.toHaveProperty("topic");
	});

	it("includes a trimmed topic string", () => {
		expect(
			JSON.parse(
				serializeCallDispatchMetadata({
					call,
					topic: "  Job interview practice  ",
				}),
			),
		).toMatchObject({ topic: "Job interview practice" });
	});
});
