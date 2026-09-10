export type VideoProcessingStatus =
	| "pending"
	| "processing"
	| "ready"
	| "failed";

export type LanguageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type VideoRecord = {
	id: string;
	title: string;
	originalFileName: string;
	mimeType: string;
	sizeBytes: number;
	sourceRelativePath: string;
	dashRelativePath: string;
	manifestFileName: string;
	status: VideoProcessingStatus;
	segmentCount: number;
	createdAt: string;
	updatedAt: string;
	failureReason: string | null;
	transcriptRelativePath: string | null;
	phrasesRelativePath: string | null;
	sourceLanguage: string;
	explanationLanguage: string;
	languageLevel: LanguageLevel;
};

export type CreateVideoInput = {
	title: string;
	originalFileName: string;
	mimeType: string;
	sizeBytes: number;
	fileBuffer: Buffer;
	sourceLanguage: string;
	explanationLanguage: string;
	languageLevel: LanguageLevel;
};

export type ProcessingStep =
	| "queued"
	| "audio_extract"
	| "transcribing"
	| "detecting_phrases"
	| "generating_clips"
	| "composing_video"
	| "dash_encoding"
	| "completed"
	| "failed";

export type ProcessingEventStatus = "started" | "completed" | "failed";

export type ProcessingHistoryEvent = {
	step: ProcessingStep;
	status: ProcessingEventStatus;
	at: string;
	message?: string;
};

export type TeacherCallStatus = "active" | "ended" | "failed";

export type TeacherCallRecord = {
	id: string;
	userId: string;
	roomName: string;
	status: TeacherCallStatus;
	sourceLanguage: string;
	languageLevel: LanguageLevel;
	explanationLanguage: string | null;
	agentDispatchId: string | null;
	endedReason: string | null;
	createdAt: string;
	endedAt: string | null;
};

export type CreateTeacherCallInput = {
	userId: string;
	sourceLanguage: string;
	languageLevel: LanguageLevel;
	explanationLanguage?: string;
};

export type VideoProcessingHistory = {
	videoId: string;
	currentStep: ProcessingStep;
	events: ProcessingHistoryEvent[];
	updatedAt: string;
};
