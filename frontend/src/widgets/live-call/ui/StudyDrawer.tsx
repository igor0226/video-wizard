import type { SavedPhrase } from "@/entities/speaking-session";

import { VocabularyPanel } from "./VocabularyPanel";

type StudyDrawerProps = {
	phrases: SavedPhrase[];
	newPhrase: string;
	onNewPhraseChange: (value: string) => void;
	onSavePhrase: (term: string) => void;
};

export function StudyDrawer({
	phrases,
	newPhrase,
	onNewPhraseChange,
	onSavePhrase,
}: StudyDrawerProps) {
	return (
		<aside className="callDrawer" aria-label="Saved phrases">
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<h2 className="text-sm font-semibold">Saved Phrases</h2>
					<span className="font-mono text-[10px] text-muted-foreground">
						{phrases.length}
					</span>
				</div>
				<VocabularyPanel
					phrases={phrases}
					newPhrase={newPhrase}
					onNewPhraseChange={onNewPhraseChange}
					onSavePhrase={onSavePhrase}
				/>
			</div>
		</aside>
	);
}
