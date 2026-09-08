import type { LanguageLevel } from "@/shared/config";

export type VideoStatus = "pending" | "processing" | "ready" | "failed";

export type { LanguageLevel };

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

export type PlaybackPhrase = {
	index: number;
	phrase: string;
	explanation: string;
	startSeconds: number;
	endSeconds: number;
};

export type PlaybackPhrasesResponse = {
	videoId: string;
	phrases: PlaybackPhrase[];
};
