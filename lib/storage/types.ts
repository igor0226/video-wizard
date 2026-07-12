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

export type VideoRepository = {
	createVideo(input: CreateVideoInput): Promise<VideoRecord>;
	listVideos(): Promise<VideoRecord[]>;
	getVideoById(videoId: string): Promise<VideoRecord | null>;
	updateVideo(
		videoId: string,
		patch: Partial<VideoRecord>,
	): Promise<VideoRecord>;
	getNextPendingVideo(): Promise<VideoRecord | null>;
};

export type BlobStorage = {
	ensureLayout(): Promise<void>;
	writeUploadFile(relativePath: string, fileBuffer: Buffer): Promise<void>;
	readText(relativePath: string): Promise<string>;
	readBytes(relativePath: string): Promise<Buffer>;
	resolveRelativePath(relativePath: string): string;
	ensureCleanDirectory(relativePath: string): Promise<string>;
	listFiles(relativePath: string): Promise<string[]>;
	fileExists(relativePath: string): Promise<boolean>;
};
