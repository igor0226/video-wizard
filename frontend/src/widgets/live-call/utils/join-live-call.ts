import type {
	ConnectionStep,
	CreateCallRequest,
	CreateCallResponse,
	TeacherEmotionMessage,
} from "@/entities/speaking-session";

import { Room } from "livekit-client";

import { createSpeakingCall } from "@/features/create-speaking-call";
import { attachExistingRemoteAudio, bindRoomEvents } from "./bind-room-events";
import { getOrCreateCallSession } from "./call-session-cache";
import { throwIfAborted } from "./connection-errors";

export type LiveCallJoinResult = {
	room: Room;
	callId: string;
	unbind: () => void;
};

export async function joinLiveCall(input: {
	attemptKey: string;
	request: CreateCallRequest;
	signal: AbortSignal;
	onStep: (step: ConnectionStep) => void;
	onCallId: (callId: string) => void;
	onTeacherAudio: (stream: MediaStream | null) => void;
	onTeacherEmotion: (message: TeacherEmotionMessage) => void;
}): Promise<LiveCallJoinResult> {
	input.onStep("permissions");
	const credentials = await loadCredentials(input.attemptKey, input.request);
	throwIfAborted(input.signal);
	input.onCallId(credentials.callId);

	const room = new Room();
	const unbind = bindRoomEvents(room, {
		onTeacherAudio: input.onTeacherAudio,
		onTeacherEmotion: input.onTeacherEmotion,
	});
	input.onStep("ice_negotiation");
	await room.connect(credentials.livekitUrl, credentials.token);
	throwIfAborted(input.signal);
	await room.localParticipant.setMicrophoneEnabled(true);
	throwIfAborted(input.signal);
	input.onStep("model_warmup");
	attachExistingRemoteAudio(room, input.onTeacherAudio);
	void room.startAudio();
	return { room, callId: credentials.callId, unbind };
}

function loadCredentials(
	attemptKey: string,
	request: CreateCallRequest,
): Promise<CreateCallResponse> {
	return getOrCreateCallSession(attemptKey, () => createSpeakingCall(request));
}
