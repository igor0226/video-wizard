import { describe, expect, it } from "vitest";

import {
	buildClipAudioFilter,
	buildClipRenderArgs,
	buildConcatAudioArgs,
	CLOSING_GAP_SECONDS,
	computeClipDurationSeconds,
} from "./explanation-clip-render";

const TTS_LOUDNESS = {
	input_i: -30.5,
	input_tp: -8.2,
	input_lra: 4.1,
	input_thresh: -40.3,
	target_offset: 12.5,
};

describe("computeClipDurationSeconds", () => {
	it("adds 500ms gaps before and after TTS audio", () => {
		expect(computeClipDurationSeconds(3)).toBe(4);
	});
});

describe("buildClipAudioFilter", () => {
	it("normalizes TTS loudness before adding clip gaps", () => {
		const filter = buildClipAudioFilter({
			gapSeconds: 0.5,
			channels: 2,
			targetIntegratedLufs: -18.2,
			ttsLoudness: TTS_LOUDNESS,
		});

		expect(filter).toContain("loudnorm=I=-18.2");
		expect(filter).toContain("linear=true");
		expect(filter).toContain("adelay=500|500,apad=pad_dur=0.5");
		expect(filter.indexOf("loudnorm=")).toBeLessThan(filter.indexOf("adelay="));
	});
});

describe("buildConcatAudioArgs", () => {
	it("pads speech audio and concatenates closing audio", () => {
		const args = buildConcatAudioArgs({
			speechAudioAbsolutePath: "/tmp/speech.mp3",
			closingAudioAbsolutePath: "/tmp/closing.mp3",
			midGapSeconds: CLOSING_GAP_SECONDS,
			outputAbsolutePath: "/tmp/combined.mp3",
		});

		expect(args).toContain("-filter_complex");
		expect(args.join(" ")).toContain(
			`[0:a]apad=pad_dur=${CLOSING_GAP_SECONDS}[a0];[a0][1:a]concat=n=2:v=0:a=1[a]`,
		);
		expect(args).toContain("/tmp/combined.mp3");
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
			targetIntegratedLufs: -18.2,
			ttsLoudness: TTS_LOUDNESS,
			outputAbsolutePath: "/tmp/clip.mp4",
		});

		expect(args).toContain("-t");
		expect(args).toContain("4");
		expect(args).not.toContain("-shortest");
		expect(args).toContain("-filter:a");
		expect(args.join(" ")).toContain("loudnorm=I=-18.2");
		expect(args.join(" ")).toContain("adelay=500|500,apad=pad_dur=0.5");
	});
});
