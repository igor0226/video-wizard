import { Global, Module } from "@nestjs/common";

import { BlobStorageService } from "./blob-storage.service";
import { VideoRepositoryService } from "./video-repository.service";

@Global()
@Module({
	providers: [BlobStorageService, VideoRepositoryService],
	exports: [BlobStorageService, VideoRepositoryService],
})
export class StorageModule {}
