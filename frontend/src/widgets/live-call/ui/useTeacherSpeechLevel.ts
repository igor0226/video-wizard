import { useEffect, useRef, useState } from "react";

import { mapSpeechLoudness, type TeacherFaceSpeech } from "@/entities/teacher";
import { startLevelPolling } from "@/shared/lib";
import { openSpeechAnalyser } from "../utils/open-speech-analyser";

const HOLD_MS = 120;

export function useTeacherSpeechLevel(
	stream: MediaStream | null,
): TeacherFaceSpeech {
	const [speech, setSpeech] = useState<TeacherFaceSpeech>("silent");
	const speechRef = useRef(speech);
	speechRef.current = speech;

	useEffect(() => {
		if (!stream) {
			speechRef.current = "silent";
			setSpeech("silent");
			return;
		}

		const monitor = openSpeechAnalyser(stream);
		let lastChange = 0;
		const stopPolling = startLevelPolling(monitor.analyser, (level) => {
			const next = mapSpeechLoudness(level, speechRef.current);
			const now = performance.now();
			if (next === speechRef.current || now - lastChange < HOLD_MS) {
				return;
			}
			lastChange = now;
			speechRef.current = next;
			setSpeech(next);
		});

		return () => {
			stopPolling();
			monitor.stop();
		};
	}, [stream]);

	return speech;
}
