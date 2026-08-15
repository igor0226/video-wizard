import { Global, Module } from "@nestjs/common";

import { BlobStorageService } from "./blob-storage.service";
import { ProcessingHistoryService } from "./processing-history.service";
import { VideoRepositoryService } from "./video-repository.service";

@Global()
@Module({
	providers: [
		BlobStorageService,
		ProcessingHistoryService,
		VideoRepositoryService,
	],
	exports: [
		BlobStorageService,
		ProcessingHistoryService,
		VideoRepositoryService,
	],
})
export class StorageModule {}
