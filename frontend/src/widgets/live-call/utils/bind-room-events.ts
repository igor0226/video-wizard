import {
	type RemoteParticipant,
	type RemoteTrack,
	type RemoteTrackPublication,
	type Room,
	RoomEvent,
} from "livekit-client";

import { attachRemoteAudio, detachRemoteAudio } from "./attach-remote-audio";
import { logTeacherEmotion } from "./log-teacher-emotion";

export function bindRoomEvents(
	room: Room,
	onTeacherAudio: () => void,
): () => void {
	const onSubscribed = (
		track: RemoteTrack,
		_publication: RemoteTrackPublication,
		_participant: RemoteParticipant,
	) => {
		if (!attachRemoteAudio(track)) {
			return;
		}
		void room.startAudio();
		onTeacherAudio();
	};
	const onUnsubscribed = (track: RemoteTrack) => {
		detachRemoteAudio(track);
	};
	const onData = (
		payload: Uint8Array,
		_p?: RemoteParticipant,
		_k?: unknown,
		topic?: string,
	) => {
		logTeacherEmotion(payload, topic);
	};
	const onPlayback = () => {
		if (!room.canPlaybackAudio) {
			void room.startAudio();
		}
	};

	room.on(RoomEvent.TrackSubscribed, onSubscribed);
	room.on(RoomEvent.TrackUnsubscribed, onUnsubscribed);
	room.on(RoomEvent.DataReceived, onData);
	room.on(RoomEvent.AudioPlaybackStatusChanged, onPlayback);

	return () => {
		room.off(RoomEvent.TrackSubscribed, onSubscribed);
		room.off(RoomEvent.TrackUnsubscribed, onUnsubscribed);
		room.off(RoomEvent.DataReceived, onData);
		room.off(RoomEvent.AudioPlaybackStatusChanged, onPlayback);
	};
}

export function attachExistingRemoteAudio(
	room: Room,
	onTeacherAudio: () => void,
): void {
	for (const participant of room.remoteParticipants.values()) {
		for (const publication of participant.trackPublications.values()) {
			if (!publication.track || !attachRemoteAudio(publication.track)) {
				continue;
			}
			void room.startAudio();
			onTeacherAudio();
		}
	}
}
