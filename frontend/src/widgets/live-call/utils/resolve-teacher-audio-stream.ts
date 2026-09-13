import type { RemoteTrack } from "livekit-client";

export function resolveTeacherAudioStream(track: RemoteTrack): MediaStream {
	return track.mediaStream ?? new MediaStream([track.mediaStreamTrack]);
}
