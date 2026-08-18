import { Module } from "@nestjs/common";

import { ExplanationClipService } from "./explanation-clip.service";
import { ExplanationTtsService } from "./explanation-tts.service";
import { FfmpegAudioService } from "./ffmpeg-audio.service";
import { FfmpegComposeService } from "./ffmpeg-compose.service";
import { FfmpegDashService } from "./ffmpeg-dash.service";
import { JobsService } from "./jobs.service";
import { PhraseDetectionService } from "./phrase-detection.service";
import { ProcessingPipelineService } from "./processing-pipeline.service";
import { ProcessingWorkerService } from "./processing.service";
import { WhisperTranscriptionService } from "./transcription.service";

@Module({
	providers: [
		FfmpegDashService,
		FfmpegAudioService,
		FfmpegComposeService,
		WhisperTranscriptionService,
		PhraseDetectionService,
		ExplanationTtsService,
		ExplanationClipService,
		ProcessingPipelineService,
		JobsService,
		ProcessingWorkerService,
	],
})
export class ProcessingModule {}
