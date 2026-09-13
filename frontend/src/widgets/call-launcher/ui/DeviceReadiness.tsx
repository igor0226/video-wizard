"use client";

import { AlertCircle, CheckCircle2, Mic } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { MicLevelMeter } from "./MicLevelMeter";
import { useMicrophoneTest } from "./useMicrophoneTest";

export function DeviceReadiness() {
	const mic = useMicrophoneTest();

	return (
		<div className="space-y-3 rounded-xl border border-border bg-muted p-4">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
						<Mic className="h-4 w-4" />
					</div>
					<div>
						<div className="flex items-center gap-1.5 text-xs font-semibold">
							Microphone Status
							<StatusIcon
								hasError={Boolean(mic.error)}
								heardInput={mic.heardInput}
							/>
						</div>
						<p
							className="font-mono text-[11px] text-muted-foreground"
							aria-live="polite"
						>
							{mic.statusLabel}
						</p>
					</div>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={mic.isStarting}
					onClick={mic.toggle}
				>
					{mic.isTesting ? "Stop Audio Check" : "Test Audio Level"}
				</Button>
			</div>
			{mic.isTesting ? <MicLevelMeter level={mic.level} /> : null}
		</div>
	);
}

function StatusIcon({
	hasError,
	heardInput,
}: {
	hasError: boolean;
	heardInput: boolean;
}) {
	if (hasError) {
		return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
	}
	if (heardInput) {
		return <CheckCircle2 className="h-3.5 w-3.5" />;
	}
	return null;
}
