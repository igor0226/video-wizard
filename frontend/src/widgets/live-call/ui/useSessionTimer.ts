import { useEffect } from "react";

export function useSessionTimer(
	setSeconds: (updater: (value: number) => number) => void,
) {
	useEffect(() => {
		const interval = window.setInterval(() => {
			setSeconds((value) => value + 1);
		}, 1000);
		return () => window.clearInterval(interval);
	}, [setSeconds]);
}
