"use client";

import type { Room } from "livekit-client";
import type {
	ConnectionStep,
	CreateCallRequest,
	TeacherEmotionMessage,
} from "@/entities/speaking-session";

import {
	type MutableRefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { endSpeakingCall } from "@/features/end-speaking-call";
import { getAnonymousUserId } from "@/shared/lib";
import { removeAttachedAudioElements } from "../utils/attach-remote-audio";
import { isAbortError, isMicDenied } from "../utils/connection-errors";
import { joinLiveCall } from "../utils/join-live-call";

type LiveCallPhase = "connecting" | "connected" | "error";
type LiveCallErrorType = "mic_denied" | "network_timeout";

const CONNECT_TIMEOUT_MS = 15000;
const IDLE_TEACHER_EMOTION: TeacherEmotionMessage = {
	emotion: "neutral",
	source: "reply",
};

export function useLiveCallConnection(
	request: Omit<CreateCallRequest, "userId">,
) {
	const [step, setStep] = useState<ConnectionStep>("permissions");
	const [phase, setPhase] = useState<LiveCallPhase>("connecting");
	const [errorType, setErrorType] =
		useState<LiveCallErrorType>("network_timeout");
	const [callId, setCallId] = useState<string | null>(null);
	const [room, setRoom] = useState<Room | null>(null);
	const [attempt, setAttempt] = useState(0);
	const [teacherEmotion, setTeacherEmotion] =
		useState<TeacherEmotionMessage>(IDLE_TEACHER_EMOTION);
	const [teacherAudioStream, setTeacherAudioStream] =
		useState<MediaStream | null>(null);
	const roomRef = useRef<Room | null>(null);
	const callIdRef = useRef<string | null>(null);
	const unbindRef = useRef<() => void>(() => {});

	useEffect(() => {
		return startConnection({
			attempt,
			request,
			setStep,
			setPhase,
			setErrorType,
			setCallId,
			setRoom,
			setTeacherEmotion,
			setTeacherAudioStream,
			roomRef,
			callIdRef,
			unbindRef,
		});
	}, [
		attempt,
		request.sourceLanguage,
		request.explanationLanguage,
		request.languageLevel,
		request.topic,
	]);

	const retry = useCallback(() => {
		setStep("permissions");
		setPhase("connecting");
		setCallId(null);
		setRoom(null);
		setTeacherEmotion(IDLE_TEACHER_EMOTION);
		setTeacherAudioStream(null);
		setAttempt((current) => current + 1);
	}, []);

	const endCall = useCallback(() => leaveCall(roomRef, callIdRef), []);
	const toggleMic = useCallback(() => toggleMicrophone(roomRef.current), []);

	return {
		step,
		phase,
		errorType,
		retry,
		room,
		callId,
		teacherEmotion,
		teacherAudioStream,
		endCall,
		toggleMic,
	};
}

function startConnection(input: {
	attempt: number;
	request: Omit<CreateCallRequest, "userId">;
	setStep: (step: ConnectionStep) => void;
	setPhase: (phase: LiveCallPhase) => void;
	setErrorType: (errorType: LiveCallErrorType) => void;
	setCallId: (callId: string | null) => void;
	setRoom: (room: Room | null) => void;
	setTeacherEmotion: (message: TeacherEmotionMessage) => void;
	setTeacherAudioStream: (stream: MediaStream | null) => void;
	roomRef: MutableRefObject<Room | null>;
	callIdRef: MutableRefObject<string | null>;
	unbindRef: MutableRefObject<() => void>;
}): () => void {
	const controller = new AbortController();
	let settled = false;
	const timeoutId = window.setTimeout(() => {
		if (settled) {
			return;
		}
		settled = true;
		controller.abort();
		input.setErrorType("network_timeout");
		input.setPhase("error");
	}, CONNECT_TIMEOUT_MS);

	const markSettled = () => {
		settled = true;
		window.clearTimeout(timeoutId);
	};

	input.setTeacherEmotion(IDLE_TEACHER_EMOTION);
	input.setTeacherAudioStream(null);

	void runJoin(
		input,
		controller,
		(stream) => {
			input.setTeacherAudioStream(stream);
			if (!stream || settled) {
				return;
			}
			markSettled();
			input.setStep("ready");
			input.setPhase("connected");
		},
		() => {
			if (settled) {
				return;
			}
			markSettled();
		},
	);

	return () => {
		controller.abort();
		window.clearTimeout(timeoutId);
		cleanupRoom(input.roomRef, input.unbindRef);
	};
}

async function runJoin(
	input: Parameters<typeof startConnection>[0],
	controller: AbortController,
	onTeacherAudio: (stream: MediaStream | null) => void,
	onFailure: () => void,
): Promise<void> {
	try {
		const joined = await joinLiveCall({
			attemptKey: String(input.attempt),
			request: { ...input.request, userId: getAnonymousUserId() },
			signal: controller.signal,
			onStep: input.setStep,
			onCallId: (id: string) => {
				input.callIdRef.current = id;
				input.setCallId(id);
			},
			onTeacherAudio,
			onTeacherEmotion: input.setTeacherEmotion,
		});
		if (controller.signal.aborted) {
			joined.unbind();
			await joined.room.disconnect();
			return;
		}
		input.unbindRef.current = joined.unbind;
		input.roomRef.current = joined.room;
		input.setRoom(joined.room);
	} catch (error) {
		if (controller.signal.aborted || isAbortError(error)) {
			return;
		}
		onFailure();
		input.setErrorType(isMicDenied(error) ? "mic_denied" : "network_timeout");
		input.setPhase("error");
	}
}

async function leaveCall(
	roomRef: MutableRefObject<Room | null>,
	callIdRef: MutableRefObject<string | null>,
): Promise<void> {
	const room = roomRef.current;
	const callId = callIdRef.current;
	if (room) {
		await room.disconnect();
		roomRef.current = null;
	}
	removeAttachedAudioElements();
	if (!callId) {
		return;
	}
	try {
		await endSpeakingCall({ callId, userId: getAnonymousUserId() });
	} catch {
		return;
	}
}

async function toggleMicrophone(room: Room | null): Promise<void> {
	if (!room) {
		return;
	}
	await room.localParticipant.setMicrophoneEnabled(
		!room.localParticipant.isMicrophoneEnabled,
	);
}

function cleanupRoom(
	roomRef: MutableRefObject<Room | null>,
	unbindRef: MutableRefObject<() => void>,
): void {
	unbindRef.current();
	unbindRef.current = () => {};
	const room = roomRef.current;
	roomRef.current = null;
	removeAttachedAudioElements();
	if (room) {
		void room.disconnect();
	}
}
