import { mapMicError } from "./map-mic-error";

function namedError(name: string): Error {
	const error = new Error(name);
	error.name = name;
	return error;
}

describe("mapMicError", () => {
	it("maps permission denial", () => {
		expect(mapMicError(namedError("NotAllowedError"))).toMatch(/denied/);
	});

	it("maps a missing device", () => {
		expect(mapMicError(namedError("NotFoundError"))).toMatch(/No microphone/);
	});

	it("maps a busy device", () => {
		expect(mapMicError(namedError("NotReadableError"))).toMatch(
			/already in use/,
		);
	});

	it("returns a generic message for unknown errors", () => {
		expect(mapMicError("nope")).toMatch(/Could not access/);
	});
});
