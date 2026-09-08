export type CallTopic = {
	id: string;
	title: string;
	level: string;
	description: string;
	suggestedDurationMins: number;
	tags: string[];
};

export type SpeakingCallStatus =
	| "scheduled"
	| "connecting"
	| "in_progress"
	| "completed"
	| "failed"
	| "cancelled";

export type SpeakingCall = {
	id: string;
	callId: string;
	topicId: string;
	topicTitle: string;
	date: string;
	duration: string;
	durationSeconds: number;
	status: SpeakingCallStatus;
	fluencyScore?: number;
	vocabularyCount?: number;
	pronunciationAccuracy?: number;
};

export type TranscriptSegment = {
	id: string;
	speaker: "teacher" | "user";
	speakerName: string;
	text: string;
	timestamp: string;
	highlightedTerms?: string[];
};

export type SavedPhrase = {
	id: string;
	term: string;
	phonetic: string;
	cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
	definition: string;
	exampleSentence?: string;
	savedAt: string;
};

export type CallControlState = {
	isMuted: boolean;
	isVideoOff: boolean;
	isCaptionsOn: boolean;
	isPanelOpen: boolean;
	activePanelTab: "transcript" | "vocabulary";
};

export type ConnectionStep =
	| "permissions"
	| "ice_negotiation"
	| "model_warmup"
	| "ready";
