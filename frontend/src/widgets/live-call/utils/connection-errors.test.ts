import { isMicDenied } from "./connection-errors";

describe("isMicDenied", () => {
	it("detects permission errors", () => {
		const denied = new Error("Permission denied");
		denied.name = "NotAllowedError";
		expect(isMicDenied(denied)).toBe(true);
	});

	it("returns false for other errors", () => {
		expect(isMicDenied(new Error("timeout"))).toBe(false);
		expect(isMicDenied("nope")).toBe(false);
	});
});
