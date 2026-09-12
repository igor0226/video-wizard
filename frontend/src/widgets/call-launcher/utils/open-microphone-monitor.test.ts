import { openMicrophoneMonitor } from "./open-microphone-monitor";

const { createAudioContext } = vi.hoisted(() => ({
	createAudioContext: vi.fn(),
}));

vi.mock("./create-audio-context", () => ({ createAudioContext }));

function fakeMonitorDeps() {
	const stopTrack = vi.fn();
	const stream = {
		getTracks: () => [{ stop: stopTrack }],
	} as unknown as MediaStream;
	const close = vi.fn().mockResolvedValue(undefined);
	const resume = vi.fn().mockResolvedValue(undefined);
	const analyser = { fftSize: 0, smoothingTimeConstant: 0 };
	const source = { connect: vi.fn() };
	createAudioContext.mockReturnValue({
		createMediaStreamSource: () => source,
		createAnalyser: () => analyser,
		state: "suspended",
		resume,
		close,
	});
	return { stopTrack, stream, close, resume, analyser, source };
}

describe("openMicrophoneMonitor", () => {
	it("opens a silent analyser graph and can stop it", async () => {
		const { stopTrack, stream, close, resume, analyser, source } =
			fakeMonitorDeps();
		const getUserMedia = vi.fn().mockResolvedValue(stream);

		const monitor = await openMicrophoneMonitor({ getUserMedia });

		expect(getUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
		expect(source.connect).toHaveBeenCalledWith(analyser);
		expect(resume).toHaveBeenCalledOnce();
		expect(analyser.fftSize).toBe(512);

		monitor.stop();
		expect(stopTrack).toHaveBeenCalledOnce();
		expect(close).toHaveBeenCalledOnce();
	});

	it("throws when getUserMedia is missing", async () => {
		await expect(
			openMicrophoneMonitor({} as Pick<MediaDevices, "getUserMedia">),
		).rejects.toThrow(/not supported/);
	});
});
