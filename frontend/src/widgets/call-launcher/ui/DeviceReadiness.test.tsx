import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeviceReadiness } from "./DeviceReadiness";

const { openMicrophoneMonitor, startLevelPolling } = vi.hoisted(() => ({
	openMicrophoneMonitor: vi.fn(),
	startLevelPolling: vi.fn(),
}));

vi.mock("../utils/open-microphone-monitor", () => ({
	openMicrophoneMonitor,
}));

vi.mock("@/shared/lib", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/shared/lib")>();
	return { ...actual, startLevelPolling };
});

function mockSuccessfulMonitor(level = 40) {
	const stop = vi.fn();
	const stopPolling = vi.fn();
	openMicrophoneMonitor.mockResolvedValue({
		stream: {
			getAudioTracks: () => [{ label: "Built-in Microphone" }],
		},
		analyser: {},
		stop,
	});
	startLevelPolling.mockImplementation(
		(_analyser, onLevel: (n: number) => void) => {
			onLevel(level);
			return stopPolling;
		},
	);
	return { stop, stopPolling };
}

describe("DeviceReadiness", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("starts idle without claiming the mic is ready", () => {
		render(<DeviceReadiness />);

		expect(screen.getByText(/Not checked/)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Test Audio Level" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("meter")).not.toBeInTheDocument();
	});

	it("shows a live meter and device name while testing", async () => {
		const user = userEvent.setup();
		mockSuccessfulMonitor(60);

		render(<DeviceReadiness />);
		await user.click(screen.getByRole("button", { name: "Test Audio Level" }));

		await waitFor(() => {
			expect(screen.getByText(/Built-in Microphone/)).toBeInTheDocument();
		});
		expect(screen.getByRole("meter")).toHaveValue(60);
		expect(
			screen.getByRole("button", { name: "Stop Audio Check" }),
		).toBeInTheDocument();
	});

	it("stops the monitor and keeps a ready status after hearing audio", async () => {
		const user = userEvent.setup();
		const { stop, stopPolling } = mockSuccessfulMonitor(40);

		render(<DeviceReadiness />);
		await user.click(screen.getByRole("button", { name: "Test Audio Level" }));
		await screen.findByRole("button", { name: "Stop Audio Check" });
		await user.click(screen.getByRole("button", { name: "Stop Audio Check" }));

		expect(stopPolling).toHaveBeenCalledOnce();
		expect(stop).toHaveBeenCalledOnce();
		expect(screen.getByText(/Ready/)).toBeInTheDocument();
		expect(screen.queryByRole("meter")).not.toBeInTheDocument();
	});

	it("shows a denial message when the browser blocks the mic", async () => {
		const user = userEvent.setup();
		const denied = new Error("denied");
		denied.name = "NotAllowedError";
		openMicrophoneMonitor.mockRejectedValue(denied);

		render(<DeviceReadiness />);
		await user.click(screen.getByRole("button", { name: "Test Audio Level" }));

		await waitFor(() => {
			expect(screen.getByText(/denied/)).toBeInTheDocument();
		});
	});
});
