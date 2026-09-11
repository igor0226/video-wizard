import { isRecord } from "./is-record";

describe("isRecord", () => {
	it("accepts plain objects", () => {
		expect(isRecord({})).toBe(true);
		expect(isRecord({ emotion: "smile" })).toBe(true);
	});

	it("rejects null and non-objects", () => {
		expect(isRecord(null)).toBe(false);
		expect(isRecord("smile")).toBe(false);
		expect(isRecord(2)).toBe(false);
		expect(isRecord(undefined)).toBe(false);
	});
});
