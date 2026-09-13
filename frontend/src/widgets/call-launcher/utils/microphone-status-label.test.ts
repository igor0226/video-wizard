import { microphoneStatusLabel } from "./microphone-status-label";

const idle = {
	error: null,
	isStarting: false,
	isTesting: false,
	heardInput: false,
	deviceLabel: null,
};

describe("microphoneStatusLabel", () => {
	it("asks the user to check when idle", () => {
		expect(microphoneStatusLabel(idle)).toBe(
			"Default System Input · Not checked",
		);
	});

	it("prompts the user to speak while listening", () => {
		expect(
			microphoneStatusLabel({
				...idle,
				isTesting: true,
				deviceLabel: "MacBook Mic",
			}),
		).toBe("MacBook Mic · Speak to see the level");
	});

	it("marks the mic ready after input was heard", () => {
		expect(
			microphoneStatusLabel({
				...idle,
				heardInput: true,
				deviceLabel: "MacBook Mic",
			}),
		).toBe("MacBook Mic · Ready");
	});

	it("surfaces permission errors", () => {
		expect(
			microphoneStatusLabel({
				...idle,
				error: "Microphone access was denied.",
			}),
		).toBe("Microphone access was denied.");
	});
});
