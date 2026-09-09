import { Module } from "@nestjs/common";

import { AgentDispatchService } from "./agent-dispatch.service";
import { LivekitRoomService } from "./livekit-room.service";
import { LivekitTokenService } from "./livekit-token.service";
import { LivekitWebhookService } from "./livekit-webhook.service";
import { SpeakingController } from "./speaking.controller";
import { SpeakingService } from "./speaking.service";

@Module({
	controllers: [SpeakingController],
	providers: [
		SpeakingService,
		LivekitTokenService,
		LivekitRoomService,
		AgentDispatchService,
		LivekitWebhookService,
	],
})
export class SpeakingModule {}
