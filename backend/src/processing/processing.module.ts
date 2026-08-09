import { Module } from "@nestjs/common";

import { FfmpegAudioService } from "./ffmpeg-audio.service";
import { FfmpegDashService } from "./ffmpeg-dash.service";
import { JobsService } from "./jobs.service";
import { ProcessingWorkerService } from "./processing.service";
import { WhisperTranscriptionService } from "./transcription.service";

@Module({
	providers: [
		FfmpegDashService,
		FfmpegAudioService,
		WhisperTranscriptionService,
		JobsService,
		ProcessingWorkerService,
	],
})
export class ProcessingModule {}
