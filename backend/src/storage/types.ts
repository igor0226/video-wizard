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
};

export type CreateVideoInput = {
	title: string;
	originalFileName: string;
	mimeType: string;
	sizeBytes: number;
	fileBuffer: Buffer;
};
