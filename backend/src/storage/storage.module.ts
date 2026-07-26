import { Global, Module } from "@nestjs/common";

import {
	blobStorage,
	getStoragePathsForVideo,
	getStorageRoot,
	videoRepository,
} from "./local-storage";

export const BLOB_STORAGE = Symbol("BLOB_STORAGE");
export const VIDEO_REPOSITORY = Symbol("VIDEO_REPOSITORY");

@Global()
@Module({
	providers: [
		{ provide: BLOB_STORAGE, useValue: blobStorage },
		{ provide: VIDEO_REPOSITORY, useValue: videoRepository },
		{
			provide: "STORAGE_PATHS",
			useValue: { getStoragePathsForVideo, getStorageRoot },
		},
	],
	exports: [BLOB_STORAGE, VIDEO_REPOSITORY, "STORAGE_PATHS"],
})
export class StorageModule {}
