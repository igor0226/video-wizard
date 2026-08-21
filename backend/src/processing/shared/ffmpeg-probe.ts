import { normalizeFfmpegError, runProcessWithOutput } from "./ffmpeg-process";

export type VideoProbeResult = {
	width: number;
	height: number;
	fps: number;
	audioSampleRate: number;
	audioChannels: number;
};

function parseFrameRate(raw: string): number {
	const [numeratorRaw, denominatorRaw] = raw.split("/");
	const numerator = Number.parseFloat(numeratorRaw);
	const denominator = Number.parseFloat(denominatorRaw ?? "1");
	if (
		!Number.isFinite(numerator) ||
		!Number.isFinite(denominator) ||
		denominator === 0
	) {
		return 30;
	}
	return numerator / denominator;
}

function parseProbeJson(raw: string): VideoProbeResult {
	const parsed = JSON.parse(raw) as {
		streams?: Array<{
			codec_type?: string;
			width?: number;
			height?: number;
			avg_frame_rate?: string;
			r_frame_rate?: string;
			sample_rate?: string;
			channels?: number;
			channel_layout?: string;
		}>;
	};

	const videoStream = parsed.streams?.find(
		(stream) => stream.codec_type === "video",
	);
	const audioStream = parsed.streams?.find(
		(stream) => stream.codec_type === "audio",
	);

	const width = videoStream?.width ?? 1280;
	const height = videoStream?.height ?? 720;
	const fps = parseFrameRate(
		videoStream?.avg_frame_rate || videoStream?.r_frame_rate || "30/1",
	);
	const audioSampleRate = Number.parseInt(
		audioStream?.sample_rate ?? "48000",
		10,
	);
	const audioChannels = audioStream?.channels ?? 2;

	return {
		width: width % 2 === 0 ? width : width - 1,
		height: height % 2 === 0 ? height : height - 1,
		fps: Number.isFinite(fps) && fps > 0 ? fps : 30,
		audioSampleRate:
			Number.isFinite(audioSampleRate) && audioSampleRate > 0
				? audioSampleRate
				: 48_000,
		audioChannels:
			Number.isFinite(audioChannels) && audioChannels > 0 ? audioChannels : 2,
	};
}

export async function probeVideoFile(
	absolutePath: string,
): Promise<VideoProbeResult> {
	try {
		const output = await runProcessWithOutput("ffprobe", [
			"-v",
			"error",
			"-show_streams",
			"-of",
			"json",
			absolutePath,
		]);
		return parseProbeJson(output);
	} catch (error) {
		throw normalizeFfmpegError(error);
	}
}

export async function probeMediaDurationSeconds(
	absolutePath: string,
): Promise<number> {
	try {
		const output = await runProcessWithOutput("ffprobe", [
			"-v",
			"error",
			"-show_entries",
			"format=duration",
			"-of",
			"default=noprint_wrappers=1:nokey=1",
			absolutePath,
		]);
		const duration = Number.parseFloat(output);
		if (!Number.isFinite(duration) || duration <= 0) {
			throw new Error("Invalid media duration");
		}
		return duration;
	} catch (error) {
		throw normalizeFfmpegError(error);
	}
}

export async function probeAudioDurationSeconds(
	absolutePath: string,
): Promise<number> {
	return probeMediaDurationSeconds(absolutePath);
}
