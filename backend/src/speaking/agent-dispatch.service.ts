import { Injectable } from "@nestjs/common";

import type {
	AgentDispatchInfo,
	CreateDispatchInput,
} from "./utils/livekit-types";
import { resolveLivekitConfig } from "./utils/resolve-livekit-config";

@Injectable()
export class AgentDispatchService {
	async createDispatch(input: CreateDispatchInput): Promise<AgentDispatchInfo> {
		const { AgentDispatchClient } = await import("livekit-server-sdk");
		const config = resolveLivekitConfig();
		const client = new AgentDispatchClient(
			config.apiUrl,
			config.apiKey,
			config.apiSecret,
		);
		const dispatch = await client.createDispatch(
			input.roomName,
			input.agentName,
			{
				metadata: input.metadata,
			},
		);
		return { id: dispatch.id };
	}
}
