import { Injectable, UnauthorizedException } from "@nestjs/common";

import { CallRepositoryService } from "../storage";
import { LivekitRoomService } from "./livekit-room.service";
import {
	LivekitWebhookEventType,
	type LivekitWebhookEvent,
} from "./utils/livekit-webhook-event";
import { resolveLivekitConfig } from "./utils/resolve-livekit-config";

@Injectable()
export class LivekitWebhookService {
	constructor(
		private readonly calls: CallRepositoryService,
		private readonly rooms: LivekitRoomService,
	) {}

	async handleWebhook(input: {
		body: string;
		authorization: string | undefined;
	}): Promise<{ ok: true }> {
		const event = await this.receiveEvent(input);
		await this.reconcileEvent(event);
		return { ok: true };
	}

	private async receiveEvent(input: {
		body: string;
		authorization: string | undefined;
	}): Promise<LivekitWebhookEvent> {
		const { WebhookReceiver } = await import("livekit-server-sdk");
		const config = resolveLivekitConfig();
		const receiver = new WebhookReceiver(config.apiKey, config.apiSecret);
		try {
			return (await receiver.receive(
				input.body,
				input.authorization,
			)) as LivekitWebhookEvent;
		} catch {
			throw new UnauthorizedException("Invalid LiveKit webhook");
		}
	}

	private async reconcileEvent(event: LivekitWebhookEvent): Promise<void> {
		const roomName = event.room?.name;
		if (!roomName) {
			return;
		}
		const call = await this.calls.getCallByRoomName(roomName);
		if (call?.status !== "active") {
			return;
		}
		if (event.event === LivekitWebhookEventType.RoomFinished) {
			await this.calls.markEnded({
				callId: call.id,
				reason: LivekitWebhookEventType.RoomFinished,
			});
			return;
		}
		if (event.event !== LivekitWebhookEventType.ParticipantLeft) {
			return;
		}
		if (event.participant?.identity !== call.userId) {
			return;
		}
		await this.rooms.deleteRoom(roomName);
		await this.calls.markEnded({
			callId: call.id,
			reason: LivekitWebhookEventType.ParticipantLeft,
		});
	}
}
