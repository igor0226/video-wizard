import { describe, expect, it } from "vitest";

import { parseTeacherJobMetadata } from "./parse-job-metadata";

describe("parseTeacherJobMetadata", () => {
	it("parses topic from job metadata", () => {
		expect(
			parseTeacherJobMetadata(
				JSON.stringify({
					callId: "call-1",
					sourceLanguage: "English",
					languageLevel: "B2",
					explanationLanguage: null,
					topic: "Travel check-in",
				}),
			),
		).toMatchObject({
			callId: "call-1",
			languageLevel: "B2",
			topic: "Travel check-in",
		});
	});

	it("falls back when metadata is empty", () => {
		expect(parseTeacherJobMetadata(undefined)).toEqual({
			callId: "unknown",
			sourceLanguage: "English",
			languageLevel: "B1",
		});
	});
});
