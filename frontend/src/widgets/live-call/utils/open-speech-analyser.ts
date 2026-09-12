import { createAudioContext } from "@/shared/lib";

export function openSpeechAnalyser(stream: MediaStream): {
	analyser: AnalyserNode;
	stop: () => void;
} {
	const context = createAudioContext();
	const source = context.createMediaStreamSource(stream);
	const analyser = context.createAnalyser();
	analyser.fftSize = 512;
	analyser.smoothingTimeConstant = 0.7;
	source.connect(analyser);
	if (context.state === "suspended") {
		void context.resume();
	}

	return {
		analyser,
		stop: () => {
			void context.close();
		},
	};
}
