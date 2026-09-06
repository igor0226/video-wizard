import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProcessingHistory, ProcessingLock, Video } from "../models";
import { BlobStorageService } from "./blob-storage.service";
import { ProcessingHistoryService } from "./processing-history.service";
import { ProcessingLockService } from "./processing-lock.service";
import { VideoRepositoryService } from "./video-repository.service";

@Global()
@Module({
	imports: [
		TypeOrmModule.forFeature([Video, ProcessingHistory, ProcessingLock]),
	],
	providers: [
		BlobStorageService,
		ProcessingHistoryService,
		ProcessingLockService,
		VideoRepositoryService,
	],
	exports: [
		BlobStorageService,
		ProcessingHistoryService,
		ProcessingLockService,
		VideoRepositoryService,
	],
})
export class StorageModule {}
