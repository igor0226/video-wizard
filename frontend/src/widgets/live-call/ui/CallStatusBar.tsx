import { formatTime } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";

type CallStatusBarProps = {
	topicTitle: string;
	sessionSeconds: number;
};

export function CallStatusBar({
	topicTitle,
	sessionSeconds,
}: CallStatusBarProps) {
	return (
		<header className="callStatusBar">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<span className="h-2.5 w-2.5 animate-pulse rounded-full bg-foreground" />
					<span className="font-mono text-xs font-semibold tracking-wider">
						LIVE CALL
					</span>
				</div>
				<span className="text-sm text-muted-foreground">{topicTitle}</span>
			</div>
			<div className="flex items-center gap-3">
				<Badge variant="outline">HD · 24ms</Badge>
				<div className="rounded-md border border-border bg-card px-3 py-1 font-mono text-xs">
					{formatTime(sessionSeconds)}
				</div>
			</div>
		</header>
	);
}
