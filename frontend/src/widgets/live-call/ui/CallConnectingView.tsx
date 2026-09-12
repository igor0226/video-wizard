import type { ConnectionStep } from "@/entities/speaking-session";

import {
	CONNECTION_ERRORS,
	CONNECTION_STEPS,
} from "@/entities/speaking-session";
import { TeacherAvatarSlot } from "@/entities/teacher";
import { Button } from "@/shared/ui/button";
import { CallConnectionError } from "./CallConnectionError";
import { ConnectingSteps } from "./ConnectingSteps";

type CallConnectingViewProps = {
	topicTitle: string;
	step: ConnectionStep;
	phase: "connecting" | "error";
	errorType: "mic_denied" | "network_timeout";
	onRetry: () => void;
	onCancel: () => void;
};

export function CallConnectingView({
	topicTitle,
	step,
	phase,
	errorType,
	onRetry,
	onCancel,
}: CallConnectingViewProps) {
	const currentLabel =
		CONNECTION_STEPS.find((item) => item.id === step)?.label ?? "";

	return (
		<div className="callConnecting">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<Button type="button" variant="ghost" size="sm" onClick={onCancel}>
					Exit to Speaking
				</Button>
				<span className="uppercase tracking-wide">{topicTitle}</span>
			</div>
			<div className="mx-auto w-full max-w-md space-y-8 text-center">
				<div className="flex flex-col items-center">
					<TeacherAvatarSlot
						size="lg"
						status="connecting"
						fallbackLabel="Elena · AI Instructor"
						className="mb-4"
					/>
					<h2 className="text-xl font-bold">Connecting to AI Instructor</h2>
					<p
						className="mt-1 text-xs text-muted-foreground"
						aria-live="assertive"
					>
						{currentLabel}
					</p>
				</div>
				{phase === "error" ? (
					<CallConnectionError
						message={CONNECTION_ERRORS[errorType]}
						onRetry={onRetry}
						onCancel={onCancel}
					/>
				) : (
					<ConnectingSteps currentStep={step} />
				)}
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel Connection
				</Button>
			</div>
			<p className="text-center font-mono text-[11px] text-muted-foreground">
				Audio encryption active · Zero cloud audio retention
			</p>
		</div>
	);
}
