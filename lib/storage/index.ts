export type {
	BlobStorage,
	CreateVideoInput,
	VideoProcessingStatus,
	VideoRecord,
	VideoRepository,
} from "./types";

export {
	blobStorage,
	getStoragePathsForVideo,
	videoRepository,
} from "./local-storage";
