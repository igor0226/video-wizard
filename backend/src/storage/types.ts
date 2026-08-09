export type VideoProcessingStatus =
	| "pending"
	| "processing"
	| "ready"
	| "failed";

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
};

export type CreateVideoInput = {
	title: string;
	originalFileName: string;
	mimeType: string;
	sizeBytes: number;
	fileBuffer: Buffer;
};

export type ProcessingStep =
	| "queued"
	| "audio_extract"
	| "transcribing"
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

export type VideoProcessingHistory = {
	videoId: string;
	currentStep: ProcessingStep;
	events: ProcessingHistoryEvent[];
	updatedAt: string;
};
