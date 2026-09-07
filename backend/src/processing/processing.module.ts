import { Module } from "@nestjs/common";

import { FfmpegAudioService } from "./audio-extract/ffmpeg-audio.service";
import { FfmpegComposeService } from "./composing-video/ffmpeg-compose.service";
import { PhraseDetectionService } from "./detecting-phrases/phrase-detection.service";
import { FfmpegDashService } from "./dash-encoding/ffmpeg-dash.service";
import { ExplanationClipService } from "./generating-clips/explanation-clip.service";
import { ExplanationTtsService } from "./generating-clips/explanation-tts.service";
import { JobsService } from "./jobs.service";
import { ProcessingPipelineService } from "./processing-pipeline.service";
import { ProcessingWorkerService } from "./processing.service";
import { MediaWorkspaceService } from "./shared/media-workspace.service";
import { WhisperTranscriptionService } from "./transcribing/transcription.service";

@Module({
	providers: [
		FfmpegDashService,
		FfmpegAudioService,
		FfmpegComposeService,
		WhisperTranscriptionService,
		PhraseDetectionService,
		ExplanationTtsService,
		ExplanationClipService,
		MediaWorkspaceService,
		ProcessingPipelineService,
		JobsService,
		ProcessingWorkerService,
	],
})
export class ProcessingModule {}
