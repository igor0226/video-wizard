import { createAudioContext } from "./create-audio-context";

describe("createAudioContext", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("creates an AudioContext", () => {
		class MockAudioContext {}
		vi.stubGlobal("AudioContext", MockAudioContext);

		expect(createAudioContext()).toBeInstanceOf(MockAudioContext);
	});

	it("throws when Web Audio is unavailable", () => {
		vi.stubGlobal("AudioContext", undefined);
		vi.stubGlobal("webkitAudioContext", undefined);

		expect(() => createAudioContext()).toThrow(/not supported/);
	});
});
