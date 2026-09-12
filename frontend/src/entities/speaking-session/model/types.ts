import type { LanguageLevel } from "@/shared/config";

export type CallTopic = {
	id: string;
	title: string;
	level: string;
	description: string;
	suggestedDurationMins: number;
	tags: string[];
};

export type SpeakingCallStatus =
	| "connecting"
	| "in_progress"
	| "completed"
	| "failed"
	| "cancelled";

export type SpeakingCall = {
	id: string;
	callId: string;
	date: string;
	duration: string;
	durationSeconds: number;
	status: SpeakingCallStatus;
	languageLevel: LanguageLevel;
	sourceLanguage: string;
	explanationLanguage: string | null;
};

export type CallHistoryItem = {
	id: string;
	status: "active" | "ended" | "failed";
	sourceLanguage: string;
	languageLevel: LanguageLevel;
	explanationLanguage: string | null;
	createdAt: string;
	endedAt: string | null;
	durationSeconds: number | null;
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
	isPanelOpen: boolean;
	activePanelTab: "transcript" | "vocabulary";
};

export type ConnectionStep =
	| "permissions"
	| "ice_negotiation"
	| "model_warmup"
	| "ready";

export type TeacherEmotion =
	| "neutral"
	| "smile"
	| "laugh"
	| "upset"
	| "surprised"
	| "angry"
	| "thoughtful";

export type EmotionSource = "reply" | "reaction";

export type EmotionIntensity = 1 | 2 | 3;

export type TeacherEmotionMessage = {
	emotion: TeacherEmotion;
	intensity?: EmotionIntensity;
	source: EmotionSource;
};

export const TEACHER_EMOTIONS: readonly TeacherEmotion[] = [
	"neutral",
	"smile",
	"laugh",
	"upset",
	"surprised",
	"angry",
	"thoughtful",
];

export const TEACHER_EMOTION_TOPIC = "teacher-emotion";

export type CreateCallRequest = {
	userId: string;
	sourceLanguage: string;
	languageLevel: LanguageLevel;
	explanationLanguage?: string;
	topic?: string;
};

export type CreateCallResponse = {
	callId: string;
	roomName: string;
	token: string;
	livekitUrl: string;
};
