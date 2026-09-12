import { resolveInputLabel } from "./resolve-input-label";

describe("resolveInputLabel", () => {
	it("uses the first audio track label", () => {
		expect(
			resolveInputLabel({
				getAudioTracks: () =>
					[{ label: "Built-in Microphone" }] as MediaStreamTrack[],
			}),
		).toBe("Built-in Microphone");
	});

	it("falls back when the label is blank", () => {
		expect(
			resolveInputLabel({
				getAudioTracks: () => [{ label: "  " }] as MediaStreamTrack[],
			}),
		).toBe("Default System Input");
	});
});
