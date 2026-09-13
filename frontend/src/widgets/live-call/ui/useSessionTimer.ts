import { useEffect, useRef, useState } from "react";

import { startElapsedClock } from "../utils/start-elapsed-clock";

export function useSessionTimer(): number {
	const startedAtMs = useRef(readMonotonicMs());
	const [seconds, setSeconds] = useState(0);

	useEffect(
		() => startElapsedClock(startedAtMs.current, readMonotonicMs, setSeconds),
		[],
	);

	return seconds;
}

function readMonotonicMs(): number {
	return performance.now();
}
