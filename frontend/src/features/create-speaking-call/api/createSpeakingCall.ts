import type {
	CreateCallRequest,
	CreateCallResponse,
} from "@/entities/speaking-session";

import { apiUrl } from "@/shared/api";
import { isRecord } from "@/shared/lib";

export async function createSpeakingCall(
	request: CreateCallRequest,
): Promise<CreateCallResponse> {
	const response = await fetch(apiUrl("/api/speaking/calls"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(request),
	});
	if (!response.ok) {
		throw new Error(`Failed to create call (${response.status})`);
	}
	return parseCreateCallResponse(await response.json());
}

export function parseCreateCallResponse(value: unknown): CreateCallResponse {
	if (!isRecord(value)) {
		throw new Error("Invalid create-call response");
	}
	const callId = readString(value, "callId");
	const roomName = readString(value, "roomName");
	const token = readString(value, "token");
	const livekitUrl = readString(value, "livekitUrl");
	return { callId, roomName, token, livekitUrl };
}

function readString(value: Record<string, unknown>, key: string): string {
	const field = value[key];
	if (typeof field !== "string" || !field.trim()) {
		throw new Error(`Invalid create-call response: ${key}`);
	}
	return field;
}
