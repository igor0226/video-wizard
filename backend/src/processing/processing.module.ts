import { Module } from "@nestjs/common";

import { ProcessingWorkerService } from "./processing.service";

@Module({
	providers: [ProcessingWorkerService],
})
export class ProcessingModule {}
