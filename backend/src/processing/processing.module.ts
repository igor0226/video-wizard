import { Module } from "@nestjs/common";

import { FfmpegAudioService } from "./ffmpeg-audio.service";
import { FfmpegDashService } from "./ffmpeg-dash.service";
import { JobsService } from "./jobs.service";
import { PhraseDetectionService } from "./phrase-detection.service";
import { ProcessingWorkerService } from "./processing.service";
import { WhisperTranscriptionService } from "./transcription.service";

@Module({
	providers: [
		FfmpegDashService,
		FfmpegAudioService,
		WhisperTranscriptionService,
		PhraseDetectionService,
		JobsService,
		ProcessingWorkerService,
	],
})
export class ProcessingModule {}
