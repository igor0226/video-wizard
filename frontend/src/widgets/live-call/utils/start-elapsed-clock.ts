import { elapsedSeconds } from "./elapsed-seconds";

export function startElapsedClock(
	startedAtMs: number,
	now: () => number,
	onSeconds: (seconds: number) => void,
): () => void {
	const sync = () => {
		onSeconds(elapsedSeconds(startedAtMs, now()));
	};

	sync();
	const intervalId = window.setInterval(sync, 1000);
	document.addEventListener("visibilitychange", sync);
	window.addEventListener("pageshow", sync);
	window.addEventListener("focus", sync);

	return () => {
		window.clearInterval(intervalId);
		document.removeEventListener("visibilitychange", sync);
		window.removeEventListener("pageshow", sync);
		window.removeEventListener("focus", sync);
	};
}
