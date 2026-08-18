import { readdir } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, type VideoRecord } from "../storage";
import { normalizeFfmpegError, runProcess } from "./ffmpeg-process";

@Injectable()
export class FfmpegDashService {
	constructor(
		@InjectPinoLogger(FfmpegDashService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
	) {}

	async generateDashAssets(
		video: VideoRecord,
	): Promise<{ segmentCount: number }> {
		await this.blobStorage.ensureLayout();
		const enrichedRelativePath = this.blobStorage.getEnrichedVideoRelativePath(
			video.id,
		);
		const enrichedAbsolutePath =
			this.blobStorage.resolveRelativePath(enrichedRelativePath);
		await this.blobStorage.ensureCleanDirectory(video.dashRelativePath);

		const { dashAbsolutePath, manifestAbsolutePath } =
			this.blobStorage.getStoragePathsForVideo(video);

		const args = [
			"-y",
			"-i",
			enrichedAbsolutePath,
			"-map",
			"0:v:0",
			"-map",
			"0:a:0?",
			"-c:v",
			"libx264",
			"-preset",
			"veryfast",
			"-crf",
			"23",
			"-c:a",
			"aac",
			"-b:a",
			"128k",
			"-use_timeline",
			"1",
			"-use_template",
			"1",
			"-seg_duration",
			"4",
			"-adaptation_sets",
			"id=0,streams=v id=1,streams=a",
			"-init_seg_name",
			"init-$RepresentationID$.m4s",
			"-media_seg_name",
			"chunk-$RepresentationID$-$Number%05d$.m4s",
			"-f",
			"dash",
			manifestAbsolutePath,
		];

		try {
			this.logger.info(
				{ videoId: video.id, output: manifestAbsolutePath },
				"ffmpeg-run",
			);
			await runProcess("ffmpeg", args);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}

		const files = await readdir(dashAbsolutePath, { withFileTypes: true });
		const segmentCount = files.filter(
			(entry) =>
				entry.isFile() && path.extname(entry.name).toLowerCase() === ".m4s",
		).length;
		return { segmentCount };
	}
}
