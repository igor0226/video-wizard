import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, type VideoRecord } from "../storage";
import { normalizeFfmpegError, runProcess } from "./ffmpeg-process";

export type ExtractAudioResult = {
	audioRelativePath: string;
};

@Injectable()
export class FfmpegAudioService {
	constructor(
		@InjectPinoLogger(FfmpegAudioService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
	) {}

	async extractAudio(video: VideoRecord): Promise<ExtractAudioResult> {
		await this.blobStorage.ensureLayout();
		const { sourceAbsolutePath } =
			this.blobStorage.getStoragePathsForVideo(video);
		const audioRelativePath = this.blobStorage.getAudioRelativePath(video.id);
		const audioDirectoryRelativePath =
			this.blobStorage.getAudioDirectoryRelativePath(video.id);
		await this.blobStorage.ensureCleanDirectory(audioDirectoryRelativePath);
		const audioAbsolutePath =
			this.blobStorage.resolveRelativePath(audioRelativePath);

		const args = [
			"-y",
			"-i",
			sourceAbsolutePath,
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
			audioAbsolutePath,
		];

		try {
			this.logger.info(
				{ videoId: video.id, output: audioAbsolutePath },
				"ffmpeg-audio-run",
			);
			await runProcess("ffmpeg", args);
		} catch (error) {
			const normalized = normalizeFfmpegError(error);
			const isNoAudioTrackError =
				/Stream map.*matches no streams|does not contain any stream/i.test(
					normalized.message,
				);

			if (isNoAudioTrackError) {
				throw new Error("Video has no audio track");
			}

			throw normalized;
		}

		const exists = await this.blobStorage.fileExists(audioRelativePath);
		if (!exists) {
			throw new Error("Audio extraction produced no output file");
		}

		return { audioRelativePath: path.posix.normalize(audioRelativePath) };
	}
}
