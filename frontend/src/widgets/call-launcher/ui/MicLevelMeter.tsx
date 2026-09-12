import { cn } from "@/shared/lib/utils";

const BAR_COUNT = 4;
const BAR_SPAN = 100 / BAR_COUNT;

export function MicLevelMeter({ level }: { level: number }) {
	return (
		<div className="space-y-1">
			<meter className="sr-only" min={0} max={100} value={level}>
				Input gain level {level} percent
			</meter>
			<div className="micMeter" aria-hidden="true">
				{Array.from({ length: BAR_COUNT }, (_, index) => (
					<div
						key={index}
						className={cn("h-full flex-1 rounded-sm", barTone(level, index))}
					/>
				))}
			</div>
		</div>
	);
}

function barTone(level: number, index: number): string {
	const filledThrough = (index + 1) * BAR_SPAN;
	if (level >= filledThrough) {
		return "bg-foreground";
	}
	if (level >= filledThrough - BAR_SPAN) {
		return "bg-foreground/60";
	}
	return "bg-muted-foreground/30";
}
