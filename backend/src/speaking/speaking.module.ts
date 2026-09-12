import { Module } from "@nestjs/common";

import { AgentDispatchService } from "./agent-dispatch.service";
import { LivekitRoomService } from "./livekit-room.service";
import { LivekitTokenService } from "./livekit-token.service";
import { LivekitWebhookService } from "./livekit-webhook.service";
import { SpeakingController } from "./speaking.controller";
import { SpeakingService } from "./speaking.service";
import { StaleCallCleanupService } from "./stale-call-cleanup.service";
import { StaleCallWorkerService } from "./stale-call-worker.service";

@Module({
	controllers: [SpeakingController],
	providers: [
		SpeakingService,
		LivekitTokenService,
		LivekitRoomService,
		AgentDispatchService,
		LivekitWebhookService,
		StaleCallCleanupService,
		StaleCallWorkerService,
	],
})
export class SpeakingModule {}
