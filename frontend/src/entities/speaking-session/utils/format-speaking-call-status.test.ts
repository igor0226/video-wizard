import { describe, expect, it } from "vitest";

import { formatSpeakingCallStatus } from "./format-speaking-call-status";

describe("formatSpeakingCallStatus", () => {
	it("labels history statuses for the table", () => {
		expect(formatSpeakingCallStatus("in_progress")).toBe("In progress");
		expect(formatSpeakingCallStatus("completed")).toBe("Completed");
		expect(formatSpeakingCallStatus("failed")).toBe("Failed");
	});
});
