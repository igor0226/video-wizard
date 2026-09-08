import type {
	SavedPhrase,
	TranscriptSegment,
} from "@/entities/speaking-session";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { TranscriptPanel } from "./TranscriptPanel";
import { VocabularyPanel } from "./VocabularyPanel";

type StudyDrawerProps = {
	segments: TranscriptSegment[];
	phrases: SavedPhrase[];
	newPhrase: string;
	activeTab: "transcript" | "vocabulary";
	onTabChange: (tab: "transcript" | "vocabulary") => void;
	onNewPhraseChange: (value: string) => void;
	onSavePhrase: (term: string) => void;
};

export function StudyDrawer({
	segments,
	phrases,
	newPhrase,
	activeTab,
	onTabChange,
	onNewPhraseChange,
	onSavePhrase,
}: StudyDrawerProps) {
	return (
		<aside className="callDrawer" aria-label="Live Study Drawer">
			<Tabs
				value={activeTab}
				onValueChange={(value) =>
					onTabChange(value as "transcript" | "vocabulary")
				}
				className="flex h-full flex-col"
			>
				<TabsList className="w-full rounded-none">
					<TabsTrigger value="transcript" className="flex-1">
						Live Transcript
					</TabsTrigger>
					<TabsTrigger value="vocabulary" className="flex-1">
						Saved Phrases
						<span className="ml-1.5 font-mono text-[10px]">
							{phrases.length}
						</span>
					</TabsTrigger>
				</TabsList>
				<TabsContent value="transcript" className="mt-0 flex-1">
					<TranscriptPanel segments={segments} onSavePhrase={onSavePhrase} />
				</TabsContent>
				<TabsContent value="vocabulary" className="mt-0 flex-1">
					<VocabularyPanel
						phrases={phrases}
						newPhrase={newPhrase}
						onNewPhraseChange={onNewPhraseChange}
						onSavePhrase={onSavePhrase}
					/>
				</TabsContent>
			</Tabs>
		</aside>
	);
}
