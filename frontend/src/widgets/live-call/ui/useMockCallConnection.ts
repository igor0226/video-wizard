"use client";

import type { ConnectionStep } from "@/entities/speaking-session";

import { useEffect, useState } from "react";

const STEP_ORDER: ConnectionStep[] = [
	"permissions",
	"ice_negotiation",
	"model_warmup",
	"ready",
];

const STEP_MS = 1200;
const TIMEOUT_MS = 15000;

export function useMockCallConnection(shouldFail = false) {
	const [step, setStep] = useState<ConnectionStep>("permissions");
	const [phase, setPhase] = useState<"connecting" | "connected" | "error">(
		"connecting",
	);
	const [errorType, setErrorType] = useState<"mic_denied" | "network_timeout">(
		"network_timeout",
	);

	useEffect(() => {
		if (phase !== "connecting") {
			return;
		}

		const timeout = window.setTimeout(() => {
			setErrorType("network_timeout");
			setPhase("error");
		}, TIMEOUT_MS);

		const interval = window.setInterval(() => {
			setStep((current) => {
				const index = STEP_ORDER.indexOf(current);
				const next = STEP_ORDER[Math.min(STEP_ORDER.length - 1, index + 1)];
				if (next === "ready" && !shouldFail) {
					window.clearTimeout(timeout);
					window.clearInterval(interval);
					setPhase("connected");
				}
				return next;
			});
		}, STEP_MS);

		return () => {
			window.clearTimeout(timeout);
			window.clearInterval(interval);
		};
	}, [phase, shouldFail]);

	const retry = () => {
		setStep("permissions");
		setPhase("connecting");
	};

	return { step, phase, errorType, retry, setPhase };
}
