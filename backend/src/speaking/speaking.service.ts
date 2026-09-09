import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { CallRepositoryService, type CreateTeacherCallInput } from "../storage";
import { AgentDispatchService } from "./agent-dispatch.service";
import { LivekitRoomService } from "./livekit-room.service";
import { LivekitTokenService } from "./livekit-token.service";
import { serializeCallDispatchMetadata } from "./utils/dispatch-metadata";
import { resolveLivekitConfig } from "./utils/resolve-livekit-config";

export type CreateCallResult = {
	callId: string;
	roomName: string;
	token: string;
	livekitUrl: string;
};

export type EndCallInput = {
	callId: string;
	userId: string;
};

export type GetCallInput = {
	callId: string;
	userId: string;
};

@Injectable()
export class SpeakingService {
	constructor(
		private readonly calls: CallRepositoryService,
		private readonly tokens: LivekitTokenService,
		private readonly rooms: LivekitRoomService,
		private readonly dispatch: AgentDispatchService,
	) {}

	async createCall(input: CreateTeacherCallInput): Promise<CreateCallResult> {
		const config = resolveLivekitConfig();
		const call = await this.calls.createCall(input);
		try {
			await this.rooms.createRoom({
				name: call.roomName,
				emptyTimeout: config.emptyRoomTimeoutSeconds,
			});
			const dispatch = await this.dispatch.createDispatch({
				roomName: call.roomName,
				agentName: config.agentName,
				metadata: serializeCallDispatchMetadata(call),
			});
			await this.calls.setAgentDispatchId({
				callId: call.id,
				agentDispatchId: dispatch.id,
			});
			const token = await this.tokens.createParticipantToken({
				identity: call.userId,
				roomName: call.roomName,
			});
			return {
				callId: call.id,
				roomName: call.roomName,
				token,
				livekitUrl: config.url,
			};
		} catch (error) {
			await this.rooms.deleteRoom(call.roomName);
			await this.calls.markFailed({
				callId: call.id,
				reason: error instanceof Error ? error.message : "call setup failed",
			});
			throw error;
		}
	}

	async getCall(input: GetCallInput) {
		return this.requireOwnedCall(input);
	}

	async endCall(input: EndCallInput) {
		const call = await this.requireOwnedCall(input);
		if (call.status !== "active") {
			throw new ConflictException("Call is not active");
		}
		await this.rooms.deleteRoom(call.roomName);
		return this.calls.markEnded({ callId: call.id, reason: "user_ended" });
	}

	private async requireOwnedCall(input: GetCallInput) {
		const call = await this.calls.getCall(input.callId);
		if (!call) {
			throw new NotFoundException("Call not found");
		}
		if (call.userId !== input.userId) {
			throw new ForbiddenException("Call does not belong to this user");
		}
		return call;
	}
}
