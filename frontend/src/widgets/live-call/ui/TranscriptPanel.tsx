import type { TranscriptSegment } from "@/entities/speaking-session";

import { Plus } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

type TranscriptPanelProps = {
	segments: TranscriptSegment[];
	onSavePhrase: (term: string) => void;
};

export function TranscriptPanel({
	segments,
	onSavePhrase,
}: TranscriptPanelProps) {
	return (
		<ScrollArea className="flex-1">
			<div className="space-y-4 p-4">
				{segments.map((segment) => (
					<div
						key={segment.id}
						className="space-y-1 rounded-xl border border-border bg-muted/60 p-3 text-xs"
					>
						<div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
							<span className="font-semibold text-foreground">
								{segment.speakerName}
							</span>
							<span>{segment.timestamp}</span>
						</div>
						<p className="leading-relaxed">{segment.text}</p>
						{segment.highlightedTerms ? (
							<div className="flex flex-wrap gap-1.5 pt-2">
								{segment.highlightedTerms.map((term) => (
									<Button
										key={term}
										type="button"
										size="sm"
										variant="secondary"
										onClick={() => onSavePhrase(term)}
									>
										<Plus className="mr-1 h-2.5 w-2.5" />
										{term}
									</Button>
								))}
							</div>
						) : null}
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
