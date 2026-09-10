import { Injectable } from "@nestjs/common";

import type { ParticipantTokenInput } from "./utils/livekit-types";
import { resolveLivekitConfig } from "./utils/resolve-livekit-config";

@Injectable()
export class LivekitTokenService {
	async createParticipantToken(input: ParticipantTokenInput): Promise<string> {
		const { AccessToken } = await import("livekit-server-sdk");
		const config = resolveLivekitConfig();
		const token = new AccessToken(config.apiKey, config.apiSecret, {
			identity: input.identity,
			ttl: config.tokenTtl,
		});
		token.addGrant({
			roomJoin: true,
			room: input.roomName,
			canPublish: true,
			canSubscribe: true,
		});
		return token.toJwt();
	}
}
