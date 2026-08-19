import { describe, expect, it } from "vitest";

import {
	buildClipAudioFilter,
	buildClipRenderArgs,
	computeClipDurationSeconds,
} from "./explanation-clip-render";

describe("computeClipDurationSeconds", () => {
	it("adds 500ms gaps before and after TTS audio", () => {
		expect(computeClipDurationSeconds(3)).toBe(4);
	});
});

describe("buildClipAudioFilter", () => {
	it("delays and pads audio for stereo clips", () => {
		expect(buildClipAudioFilter({ gapSeconds: 0.5, channels: 2 })).toBe(
			"adelay=500|500,apad=pad_dur=0.5",
		);
	});
});

describe("buildClipRenderArgs", () => {
	it("uses total clip duration instead of shortest stream", () => {
		const args = buildClipRenderArgs({
			width: 1280,
			height: 720,
			fps: 30,
			durationSeconds: 4,
			audioAbsolutePath: "/tmp/audio.mp3",
			assAbsolutePath: "/tmp/clip.ass",
			audioSampleRate: 48_000,
			audioChannels: 2,
			outputAbsolutePath: "/tmp/clip.mp4",
		});

		expect(args).toContain("-t");
		expect(args).toContain("4");
		expect(args).not.toContain("-shortest");
		expect(args).toContain("adelay=500|500,apad=pad_dur=0.5");
	});
});
