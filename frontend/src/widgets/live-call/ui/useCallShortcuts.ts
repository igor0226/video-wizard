import type { CallControlState } from "@/entities/speaking-session";

import { useEffect } from "react";

export function useCallShortcuts(
	setControls: React.Dispatch<React.SetStateAction<CallControlState>>,
	onEnd: () => void,
	onToggleMute?: () => void,
) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "m" || event.key === "M") {
				setControls((current) => ({ ...current, isMuted: !current.isMuted }));
				onToggleMute?.();
			}
			if (event.key === "Escape") {
				onEnd();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onEnd, onToggleMute, setControls]);
}
