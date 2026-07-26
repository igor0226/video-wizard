import { Module } from "@nestjs/common";

import { FfmpegDashService } from "./ffmpeg-dash.service";
import { JobsService } from "./jobs.service";
import { ProcessingWorkerService } from "./processing.service";

@Module({
	providers: [FfmpegDashService, JobsService, ProcessingWorkerService],
})
export class ProcessingModule {}
