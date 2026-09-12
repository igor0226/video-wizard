import { computeInputLevel } from "./compute-input-level";

export function startLevelPolling(
	analyser: Pick<AnalyserNode, "fftSize" | "getByteTimeDomainData">,
	onLevel: (level: number) => void,
): () => void {
	const samples = new Uint8Array(analyser.fftSize);
	let frame = 0;

	const tick = () => {
		analyser.getByteTimeDomainData(samples);
		onLevel(computeInputLevel(samples));
		frame = requestAnimationFrame(tick);
	};

	frame = requestAnimationFrame(tick);
	return () => cancelAnimationFrame(frame);
}
