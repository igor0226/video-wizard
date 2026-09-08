"use client";

import type {
	CallControlState,
	SavedPhrase,
} from "@/entities/speaking-session";

import { useEffect, useState } from "react";

import {
	LIVE_CAPTION,
	SAVED_PHRASES,
	TRANSCRIPT_FIXTURE,
} from "@/entities/speaking-session";
import { TeacherAvatarSlot } from "@/entities/teacher";
import { saveCallPhrase } from "@/features/save-call-phrase";
import { CallControlDock } from "./CallControlDock";
import { CallStatusBar } from "./CallStatusBar";
import { EndCallDialog } from "./EndCallDialog";
import { LiveCaptions } from "./LiveCaptions";
import { SelfViewPreview } from "./SelfViewPreview";
import { StudyDrawer } from "./StudyDrawer";

type CallConnectedViewProps = {
	topicTitle: string;
	onEndCall: () => void;
};

const INITIAL_CONTROLS: CallControlState = {
	isMuted: false,
	isVideoOff: false,
	isCaptionsOn: true,
	isPanelOpen: true,
	activePanelTab: "transcript",
};

export function CallConnectedView({
	topicTitle,
	onEndCall,
}: CallConnectedViewProps) {
	const [sessionSeconds, setSessionSeconds] = useState(258);
	const [controls, setControls] = useState(INITIAL_CONTROLS);
	const [showEndModal, setShowEndModal] = useState(false);
	const [savedPhrases, setSavedPhrases] =
		useState<SavedPhrase[]>(SAVED_PHRASES);
	const [newPhrase, setNewPhrase] = useState("");

	useSessionTimer(setSessionSeconds);
	useCallShortcuts(setControls, () => setShowEndModal(true));

	return (
		<div className="callConnected">
			<CallStatusBar topicTitle={topicTitle} sessionSeconds={sessionSeconds} />
			<div className="callStageWrap">
				<CallStage
					controls={controls}
					onToggle={(key) =>
						setControls((current) => ({
							...current,
							[key]: !current[key],
						}))
					}
					onEndCall={() => setShowEndModal(true)}
				/>
				{controls.isPanelOpen ? (
					<StudyDrawer
						segments={TRANSCRIPT_FIXTURE}
						phrases={savedPhrases}
						newPhrase={newPhrase}
						activeTab={controls.activePanelTab}
						onTabChange={(tab) =>
							setControls((current) => ({ ...current, activePanelTab: tab }))
						}
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

function CallStage({
	controls,
	onToggle,
	onEndCall,
}: {
	controls: CallControlState;
	onToggle: (
		key: "isMuted" | "isVideoOff" | "isCaptionsOn" | "isPanelOpen",
	) => void;
	onEndCall: () => void;
}) {
	return (
		<div className="callStage">
			<div className="callStageCanvas">
				<TeacherAvatarSlot
					size="call-stage"
					status="speaking"
					fallbackLabel="Elena (AI Instructor)"
				/>
				<SelfViewPreview
					isCameraOff={controls.isVideoOff}
					isMuted={controls.isMuted}
				/>
				<LiveCaptions text={LIVE_CAPTION} visible={controls.isCaptionsOn} />
			</div>
			<CallControlDock
				controls={controls}
				onToggleMute={() => onToggle("isMuted")}
				onToggleCamera={() => onToggle("isVideoOff")}
				onToggleCaptions={() => onToggle("isCaptionsOn")}
				onTogglePanel={() => onToggle("isPanelOpen")}
				onEndCall={onEndCall}
			/>
		</div>
	);
}

function useSessionTimer(
	setSeconds: (updater: (value: number) => number) => void,
) {
	useEffect(() => {
		const interval = window.setInterval(() => {
			setSeconds((value) => value + 1);
		}, 1000);
		return () => window.clearInterval(interval);
	}, [setSeconds]);
}

function useCallShortcuts(
	setControls: React.Dispatch<React.SetStateAction<CallControlState>>,
	onEnd: () => void,
) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "m" || event.key === "M") {
				setControls((current) => ({ ...current, isMuted: !current.isMuted }));
			}
			if (event.key === "v" || event.key === "V") {
				setControls((current) => ({
					...current,
					isVideoOff: !current.isVideoOff,
				}));
			}
			if (event.key === "c" || event.key === "C") {
				setControls((current) => ({
					...current,
					isCaptionsOn: !current.isCaptionsOn,
				}));
			}
			if (event.key === "Escape") {
				onEnd();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onEnd, setControls]);
}
