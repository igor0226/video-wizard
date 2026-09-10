import { Injectable } from "@nestjs/common";

import type { CreateRoomInput } from "./utils/livekit-types";
import { resolveLivekitConfig } from "./utils/resolve-livekit-config";

@Injectable()
export class LivekitRoomService {
	private clientPromise: ReturnType<LivekitRoomService["createClient"]> | null =
		null;

	async createRoom(input: CreateRoomInput): Promise<void> {
		const client = await this.getClient();
		await client.createRoom({
			name: input.name,
			emptyTimeout: input.emptyTimeout,
		});
	}

	async deleteRoom(roomName: string): Promise<void> {
		const client = await this.getClient();
		try {
			await client.deleteRoom(roomName);
		} catch (error) {
			if (isNotFoundError(error)) {
				return;
			}
			throw error;
		}
	}

	async removeParticipant(input: {
		roomName: string;
		identity: string;
	}): Promise<void> {
		const client = await this.getClient();
		try {
			await client.removeParticipant(input.roomName, input.identity);
		} catch (error) {
			if (isNotFoundError(error)) {
				return;
			}
			throw error;
		}
	}

	private getClient() {
		if (!this.clientPromise) {
			this.clientPromise = this.createClient();
		}
		return this.clientPromise;
	}

	private async createClient() {
		const { RoomServiceClient } = await import("livekit-server-sdk");
		const config = resolveLivekitConfig();
		return new RoomServiceClient(
			config.apiUrl,
			config.apiKey,
			config.apiSecret,
		);
	}
}

function isNotFoundError(error: unknown): boolean {
	const status = (error as { status?: number; code?: number }).status;
	const code = (error as { status?: number; code?: number }).code;
	const message = error instanceof Error ? error.message.toLowerCase() : "";
	return status === 404 || code === 404 || message.includes("not found");
}
