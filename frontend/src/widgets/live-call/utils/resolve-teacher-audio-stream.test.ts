import type { RemoteTrack } from "livekit-client";

import { resolveTeacherAudioStream } from "./resolve-teacher-audio-stream";

describe("resolveTeacherAudioStream", () => {
	it("uses the track MediaStream when present", () => {
		const mediaStream = { id: "teacher-audio" } as MediaStream;
		const track = { mediaStream } as RemoteTrack;

		expect(resolveTeacherAudioStream(track)).toBe(mediaStream);
	});
});
