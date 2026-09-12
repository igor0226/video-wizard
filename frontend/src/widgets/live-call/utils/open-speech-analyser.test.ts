import { openSpeechAnalyser } from "./open-speech-analyser";

const { createAudioContext } = vi.hoisted(() => ({
	createAudioContext: vi.fn(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/shared/lib")>();
	return { ...actual, createAudioContext };
});

describe("openSpeechAnalyser", () => {
	it("connects a stream source to an analyser only", () => {
		const connect = vi.fn();
		const close = vi.fn().mockResolvedValue(undefined);
		const analyser = { fftSize: 0, smoothingTimeConstant: 0 };
		createAudioContext.mockReturnValue({
			createMediaStreamSource: () => ({ connect }),
			createAnalyser: () => analyser,
			state: "running",
			resume: vi.fn(),
			close,
		});

		const monitor = openSpeechAnalyser({} as MediaStream);

		expect(connect).toHaveBeenCalledWith(analyser);
		expect(analyser.fftSize).toBe(512);
		monitor.stop();
		expect(close).toHaveBeenCalledOnce();
	});
});
