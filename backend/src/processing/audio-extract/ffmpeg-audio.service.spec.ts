import { beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorageService } from "../../storage";
import type { MediaWorkspace } from "../shared/media-workspace.service";
import { MediaWorkspaceService } from "../shared/media-workspace.service";
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
	let workspace: MediaWorkspace;
	let mediaWorkspace: MediaWorkspaceService;
	let service: FfmpegAudioService;

	beforeEach(() => {
		vi.clearAllMocks();
		workspace = {
			dir: "/tmp/workspace",
			download: vi.fn(async () => "/tmp/workspace/source/source.mp4"),
			localPath: vi.fn(
				async (relative: string) => `/tmp/workspace/${relative}`,
			),
			upload: vi.fn(async () => undefined),
			dispose: vi.fn(async () => undefined),
		} as unknown as MediaWorkspace;
		mediaWorkspace = {
			create: vi.fn(async () => workspace),
		} as unknown as MediaWorkspaceService;
		blobStorage = {
			ensureLayout: vi.fn(),
			getAudioRelativePath: vi.fn(() => "audio/video-1/track.mp3"),
			getAudioDirectoryRelativePath: vi.fn(() => "audio/video-1"),
			ensureCleanDirectory: vi.fn(),
			fileExists: vi.fn(async () => true),
			listObjectKeys: vi.fn(async () => ["uploads/video-1/clip.mp4"]),
			getUploadDirectoryRelativePath: vi.fn(() => "uploads/video-1"),
		} as unknown as BlobStorageService;
		service = new FfmpegAudioService(
			{ info: vi.fn() } as never,
			blobStorage,
			mediaWorkspace,
		);
	});

	it("extracts mono mp3 audio with required audio stream mapping", async () => {
		const runProcess = vi.mocked(ffmpegProcess.runProcess);
		runProcess.mockResolvedValue(undefined);

		const result = await service.extractAudio(video);

		expect(result.audioRelativePath).toBe("audio/video-1/track.mp3");
		expect(runProcess).toHaveBeenCalledWith("ffmpeg", [
			"-y",
			"-i",
			"/tmp/workspace/source/source.mp4",
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
			"/tmp/workspace/track.mp3",
		]);
		expect(workspace.upload).toHaveBeenCalledWith({
			localPath: "/tmp/workspace/track.mp3",
			key: "audio/video-1/track.mp3",
		});
		expect(workspace.dispose).toHaveBeenCalled();
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
