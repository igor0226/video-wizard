"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { startLevelPolling } from "@/shared/lib";
import { mapMicError } from "../utils/map-mic-error";
import { microphoneStatusLabel } from "../utils/microphone-status-label";
import {
	type MicrophoneMonitor,
	openMicrophoneMonitor,
} from "../utils/open-microphone-monitor";
import { resolveInputLabel } from "../utils/resolve-input-label";

const HEARD_THRESHOLD = 8;

export function useMicrophoneTest() {
	const [isStarting, setIsStarting] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [level, setLevel] = useState(0);
	const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
	const [heardInput, setHeardInput] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const sessionRef = useRef(0);
	const disposeRef = useRef<(() => void) | null>(null);

	const stop = useCallback(() => {
		sessionRef.current += 1;
		disposeRef.current?.();
		disposeRef.current = null;
		setIsTesting(false);
		setIsStarting(false);
		setLevel(0);
	}, []);

	const start = useCallback(async () => {
		const session = beginMicSession(sessionRef, setError, setHeardInput);
		setIsStarting(true);
		await attachMicrophoneMonitor({
			session,
			sessionRef,
			disposeRef,
			setLevel,
			setHeardInput,
			setDeviceLabel,
			setIsTesting,
			setError,
			setIsStarting,
		});
	}, []);

	useEffect(() => () => stop(), [stop]);

	const toggle = useCallback(() => {
		if (isTesting || isStarting) {
			stop();
			return;
		}
		void start();
	}, [isStarting, isTesting, start, stop]);

	return {
		isStarting,
		isTesting,
		level,
		error,
		heardInput,
		toggle,
		statusLabel: microphoneStatusLabel({
			error,
			isStarting,
			isTesting,
			heardInput,
			deviceLabel,
		}),
	};
}

async function attachMicrophoneMonitor(input: {
	session: number;
	sessionRef: { current: number };
	disposeRef: { current: (() => void) | null };
	setLevel: (level: number) => void;
	setHeardInput: (heard: boolean) => void;
	setDeviceLabel: (label: string) => void;
	setIsTesting: (value: boolean) => void;
	setError: (error: string | null) => void;
	setIsStarting: (value: boolean) => void;
}): Promise<void> {
	try {
		const monitor = await openMicrophoneMonitor();
		if (input.session !== input.sessionRef.current) {
			monitor.stop();
			return;
		}
		input.disposeRef.current = bindMonitor(
			monitor,
			input.setLevel,
			input.setHeardInput,
		);
		input.setDeviceLabel(resolveInputLabel(monitor.stream));
		input.setIsTesting(true);
	} catch (cause) {
		if (input.session === input.sessionRef.current) {
			input.setError(mapMicError(cause));
		}
	} finally {
		if (input.session === input.sessionRef.current) {
			input.setIsStarting(false);
		}
	}
}

function beginMicSession(
	sessionRef: { current: number },
	setError: (error: string | null) => void,
	setHeardInput: (heard: boolean) => void,
): number {
	const session = sessionRef.current + 1;
	sessionRef.current = session;
	setError(null);
	setHeardInput(false);
	return session;
}

function bindMonitor(
	monitor: MicrophoneMonitor,
	setLevel: (level: number) => void,
	setHeardInput: (heard: boolean) => void,
): () => void {
	const stopPolling = startLevelPolling(monitor.analyser, (next) => {
		setLevel(next);
		if (next >= HEARD_THRESHOLD) {
			setHeardInput(true);
		}
	});

	return () => {
		stopPolling();
		monitor.stop();
	};
}
