import { parseCefrLevel } from "./parse-cefr-level";

describe("parseCefrLevel", () => {
	it("uses the first CEFR token from a range", () => {
		expect(parseCefrLevel("B2-C1")).toBe("B2");
		expect(parseCefrLevel("A2-B1")).toBe("A2");
	});

	it("accepts a single level", () => {
		expect(parseCefrLevel("C1")).toBe("C1");
	});

	it("defaults to B1 when no CEFR token is present", () => {
		expect(parseCefrLevel("")).toBe("B1");
		expect(parseCefrLevel("intermediate")).toBe("B1");
	});
});
