import { startLevelPolling } from "./start-level-polling";

describe("startLevelPolling", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("reports a level and cancels the next frame", () => {
		const onLevel = vi.fn();
		const cancel = vi.fn();
		const frames: FrameRequestCallback[] = [];

		vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
			frames.push(callback);
			return 7;
		});
		vi.stubGlobal("cancelAnimationFrame", cancel);

		const stop = startLevelPolling(
			{
				fftSize: 4,
				getByteTimeDomainData: (buffer) => {
					buffer.fill(200);
				},
			},
			onLevel,
		);

		expect(frames).toHaveLength(1);
		frames[0](0);
		expect(onLevel).toHaveBeenCalledOnce();
		expect(onLevel.mock.calls[0][0]).toBeGreaterThan(0);

		stop();
		expect(cancel).toHaveBeenCalledWith(7);
	});
});
