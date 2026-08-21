import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../../storage";
import { makeTestVideoRecord } from "../../../test/helpers/make-test-video-record";
import { FfmpegAudioService } from "./ffmpeg-audio.service";
import * as ffmpegProcess from "../shared/ffmpeg-process";

vi.mock("../shared/ffmpeg-process", () => ({
	runProcess: vi.fn(),
	normalizeFfmpegError: vi.fn((error: unknown) =>
		error instanceof Error ? error : new Error("ffmpeg failed"),
	),
}));

describe("FfmpegAudioService", () => {
	const video = makeTestVideoRecord({ status: "processing" });

	let blobStorage: BlobStorageService;
	let service: FfmpegAudioService;

	beforeEach(() => {
		vi.clearAllMocks();
		blobStorage = {
			ensureLayout: vi.fn(),
			getStoragePathsForVideo: vi.fn(() => ({
				sourceAbsolutePath: "/tmp/uploads/video-1/clip.mp4",
				dashAbsolutePath: "/tmp/dash/video-1",
				manifestAbsolutePath: "/tmp/dash/video-1/manifest.mpd",
			})),
			getAudioRelativePath: vi.fn(() => "audio/video-1/track.mp3"),
			getAudioDirectoryRelativePath: vi.fn(() => "audio/video-1"),
			ensureCleanDirectory: vi.fn(),
			resolveRelativePath: vi.fn(
				(relativePath: string) => `/tmp/${relativePath}`,
			),
			fileExists: vi.fn(async () => true),
		} as unknown as BlobStorageService;
		service = new FfmpegAudioService({ info: vi.fn() } as never, blobStorage);
	});

	it("extracts mono mp3 audio with required audio stream mapping", async () => {
		const runProcess = vi.mocked(ffmpegProcess.runProcess);
		runProcess.mockResolvedValue(undefined);

		const result = await service.extractAudio(video);

		expect(result.audioRelativePath).toBe("audio/video-1/track.mp3");
		expect(runProcess).toHaveBeenCalledWith("ffmpeg", [
			"-y",
			"-i",
			"/tmp/uploads/video-1/clip.mp4",
			"-map",
			"0:a:0",
			"-vn",
			"-ac",
			"1",
			"-ar",
			"16000",
			"-c:a",
			"libmp3lame",
			"-b:a",
			"64k",
			"/tmp/audio/video-1/track.mp3",
		]);
	});

	it("maps missing audio stream errors to a clear message", async () => {
		vi.mocked(ffmpegProcess.runProcess).mockRejectedValue(
			new Error("Stream map '0:a:0' matches no streams"),
		);
		vi.mocked(ffmpegProcess.normalizeFfmpegError).mockReturnValue(
			new Error("Stream map '0:a:0' matches no streams"),
		);

		await expect(service.extractAudio(video)).rejects.toThrow(
			"Video has no audio track",
		);
	});
});
