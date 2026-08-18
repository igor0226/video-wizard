export type VideoStatus = "pending" | "processing" | "ready" | "failed";

export type LanguageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

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

export type VideoItem = {
	id: string;
	title: string;
	status: VideoStatus;
	sizeBytes: number;
	chunkCount: number;
	playable: boolean;
	createdAt: string;
	updatedAt: string;
	failureReason: string | null;
	dashManifestUrl: string | null;
	processingStep: ProcessingStep;
	queuePosition: number | null;
	sourceLanguage: string;
	explanationLanguage: string;
	languageLevel: LanguageLevel;
};

export type VideosResponse = {
	videos: VideoItem[];
};

export type VideoStatusResponse = {
	id: string;
	status: VideoStatus;
	failureReason: string | null;
	playable: boolean;
	chunkCount: number;
	processingStep: ProcessingStep;
	queuePosition: number | null;
	processingHistory: ProcessingHistoryEvent[];
	sourceLanguage: string;
	explanationLanguage: string;
	languageLevel: LanguageLevel;
};

export type VideoRetryResponse = {
	id: string;
	status: "pending";
	resumeFromStep: ProcessingStep;
	failureReason: null;
};
