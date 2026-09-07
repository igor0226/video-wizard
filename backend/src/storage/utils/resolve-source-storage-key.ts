import type { BlobStorageService } from "../blob-storage.service";
import type { VideoRecord } from "../types";

export async function resolveSourceStorageKey(
	blobStorage: BlobStorageService,
	video: VideoRecord,
): Promise<string> {
	if (await blobStorage.fileExists(video.sourceRelativePath)) {
		return video.sourceRelativePath;
	}

	const keys = await blobStorage.listObjectKeys(
		blobStorage.getUploadDirectoryRelativePath(video.id),
	);
	if (keys.length === 1) {
		return keys[0];
	}
	if (keys.length === 0) {
		throw new Error(
			`Source upload not found for video ${video.id} (expected ${video.sourceRelativePath})`,
		);
	}
	throw new Error(
		`Multiple source uploads found for video ${video.id}; cannot resolve source file`,
	);
}
