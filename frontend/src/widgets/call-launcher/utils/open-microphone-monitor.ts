import { createAudioContext } from "./create-audio-context";

export type MicrophoneMonitor = {
	stream: MediaStream;
	analyser: AnalyserNode;
	stop: () => void;
};

export async function openMicrophoneMonitor(
	mediaDevices: Pick<MediaDevices, "getUserMedia"> = navigator.mediaDevices,
): Promise<MicrophoneMonitor> {
	if (!mediaDevices?.getUserMedia) {
		throw new Error("Microphone capture is not supported in this browser.");
	}

	const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
	const context = createAudioContext();
	const source = context.createMediaStreamSource(stream);
	const analyser = context.createAnalyser();
	analyser.fftSize = 512;
	analyser.smoothingTimeConstant = 0.7;
	source.connect(analyser);

	if (context.state === "suspended") {
		await context.resume();
	}

	return {
		stream,
		analyser,
		stop: () => {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			void context.close();
		},
	};
}
