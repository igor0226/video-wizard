import type { SavedPhrase } from "@/entities/speaking-session";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";

type VocabularyPanelProps = {
	phrases: SavedPhrase[];
	newPhrase: string;
	onNewPhraseChange: (value: string) => void;
	onSavePhrase: (term: string) => void;
};

export function VocabularyPanel({
	phrases,
	newPhrase,
	onNewPhraseChange,
	onSavePhrase,
}: VocabularyPanelProps) {
	return (
		<div className="flex flex-1 flex-col justify-between">
			<ScrollArea className="flex-1">
				<div className="space-y-3 p-4">
					{phrases.length === 0 ? (
						<p className="text-xs text-muted-foreground">
							No phrases bookmarked during this call.
						</p>
					) : (
						phrases.map((phrase) => (
							<div
								key={phrase.id}
								className="space-y-1.5 rounded-xl border border-border bg-muted p-3"
							>
								<div className="flex items-center justify-between">
									<div className="text-xs font-bold">{phrase.term}</div>
									<Badge variant="secondary">{phrase.cefr}</Badge>
								</div>
								<div className="font-mono text-[11px] text-muted-foreground">
									{phrase.phonetic} · Saved at {phrase.savedAt}
								</div>
								<p className="text-xs leading-normal">{phrase.definition}</p>
							</div>
						))
					)}
				</div>
			</ScrollArea>
			<div className="flex gap-2 border-t border-border p-4">
				<Input
					value={newPhrase}
					onChange={(event) => onNewPhraseChange(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							onSavePhrase(newPhrase);
						}
					}}
					placeholder="Add custom phrase..."
				/>
				<Button type="button" onClick={() => onSavePhrase(newPhrase)}>
					Save
				</Button>
			</div>
		</div>
	);
}
