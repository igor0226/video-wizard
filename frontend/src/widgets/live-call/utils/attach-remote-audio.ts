import { type RemoteTrack, Track } from "livekit-client";

export function attachRemoteAudio(track: RemoteTrack): HTMLMediaElement | null {
	if (track.kind !== Track.Kind.Audio) {
		return null;
	}
	const element = track.attach();
	element.autoplay = true;
	element.setAttribute("data-livekit-audio", "teacher");
	document.body.append(element);
	return element;
}

export function detachRemoteAudio(track: RemoteTrack): void {
	for (const element of track.detach()) {
		element.remove();
	}
}

export function removeAttachedAudioElements(): void {
	for (const element of document.querySelectorAll("[data-livekit-audio]")) {
		element.remove();
	}
}
