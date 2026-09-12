"use client";

import type {
	CallControlState,
	SavedPhrase,
} from "@/entities/speaking-session";

import { useState } from "react";

import { SAVED_PHRASES } from "@/entities/speaking-session";
import { saveCallPhrase } from "@/features/save-call-phrase";
import { CallStage } from "./CallStage";
import { CallStatusBar } from "./CallStatusBar";
import { EndCallDialog } from "./EndCallDialog";
import { StudyDrawer } from "./StudyDrawer";
import { useCallShortcuts } from "./useCallShortcuts";
import { useSessionTimer } from "./useSessionTimer";

type CallConnectedViewProps = {
	topicTitle: string;
	onEndCall: () => void;
	onToggleMute?: () => void;
};

const INITIAL_CONTROLS: CallControlState = {
	isMuted: false,
	isPanelOpen: true,
};

export function CallConnectedView({
	topicTitle,
	onEndCall,
	onToggleMute,
}: CallConnectedViewProps) {
	const sessionSeconds = useSessionTimer();
	const [controls, setControls] = useState(INITIAL_CONTROLS);
	const [showEndModal, setShowEndModal] = useState(false);
	const [savedPhrases, setSavedPhrases] =
		useState<SavedPhrase[]>(SAVED_PHRASES);
	const [newPhrase, setNewPhrase] = useState("");

	useCallShortcuts(setControls, () => setShowEndModal(true), onToggleMute);

	return (
		<div className="callConnected">
			<CallStatusBar topicTitle={topicTitle} sessionSeconds={sessionSeconds} />
			<div className="callStageWrap">
				<CallStage
					isMuted={controls.isMuted}
					isPanelOpen={controls.isPanelOpen}
					onToggleMute={() => {
						onToggleMute?.();
						setControls((current) => ({
							...current,
							isMuted: !current.isMuted,
						}));
					}}
					onTogglePanel={() =>
						setControls((current) => ({
							...current,
							isPanelOpen: !current.isPanelOpen,
						}))
					}
					onEndCall={() => setShowEndModal(true)}
				/>
				{controls.isPanelOpen ? (
					<StudyDrawer
						phrases={savedPhrases}
						newPhrase={newPhrase}
						onNewPhraseChange={setNewPhrase}
						onSavePhrase={(term) => {
							const next = saveCallPhrase(term, sessionSeconds, savedPhrases);
							if (!next) {
								return;
							}
							setSavedPhrases(next.phrases);
							setNewPhrase(next.input);
						}}
					/>
				) : null}
			</div>
			<EndCallDialog
				open={showEndModal}
				savedCount={savedPhrases.length}
				onContinue={() => setShowEndModal(false)}
				onConfirm={onEndCall}
			/>
		</div>
	);
}
