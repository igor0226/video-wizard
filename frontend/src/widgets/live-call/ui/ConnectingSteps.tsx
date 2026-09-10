import type { ConnectionStep } from "@/entities/speaking-session";

import { CONNECTION_STEPS } from "@/entities/speaking-session";

type ConnectingStepsProps = {
	currentStep: ConnectionStep;
};

export function ConnectingSteps({ currentStep }: ConnectingStepsProps) {
	return (
		<div className="space-y-3 rounded-xl border border-border bg-card p-4 text-left text-xs">
			{CONNECTION_STEPS.map((item) => {
				const isCurrent = item.id === currentStep;
				return (
					<div key={item.id} className="flex items-center justify-between">
						<span
							className={
								isCurrent ? "text-foreground" : "text-muted-foreground"
							}
						>
							{item.label}
						</span>
						<span className="font-mono text-[11px] text-muted-foreground">
							{isCurrent ? "In progress" : ""}
						</span>
					</div>
				);
			})}
		</div>
	);
}
