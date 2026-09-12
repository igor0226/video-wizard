"use client";

import { CheckCircle2, Mic } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

export function DeviceReadiness() {
	const [isMicTesting, setIsMicTesting] = useState(false);

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
							<CheckCircle2 className="h-3.5 w-3.5" />
						</div>
						<p className="font-mono text-[11px] text-muted-foreground">
							Default System Input · Ready
						</p>
					</div>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setIsMicTesting((value) => !value)}
				>
					{isMicTesting ? "Stop Audio Check" : "Test Audio Level"}
				</Button>
			</div>
			{isMicTesting ? (
				<div className="micMeter" role="img" aria-label="Input gain level">
					<div className="h-full w-1/4 rounded-sm bg-foreground" />
					<div className="h-full w-1/4 rounded-sm bg-foreground" />
					<div className="h-full w-1/4 rounded-sm bg-foreground/60" />
					<div className="h-full w-1/4 rounded-sm bg-muted-foreground/30" />
				</div>
			) : null}
		</div>
	);
}
