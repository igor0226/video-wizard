import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { BlobStorageService, VideoRepositoryService } from "../storage";
import { FfmpegAudioService } from "./ffmpeg-audio.service";
import { FfmpegDashService } from "./ffmpeg-dash.service";
import { WhisperTranscriptionService } from "./transcription.service";

function normalizeFailureMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message.slice(0, 400);
	}
	return "Unexpected processing error";
}

@Injectable()
export class JobsService {
	constructor(
		@InjectPinoLogger(JobsService.name)
		private readonly logger: PinoLogger,
		private readonly ffmpegDashService: FfmpegDashService,
		private readonly ffmpegAudioService: FfmpegAudioService,
		private readonly transcriptionService: WhisperTranscriptionService,
		private readonly videoRepository: VideoRepositoryService,
		private readonly blobStorage: BlobStorageService,
	) {}

	async processNextPendingVideo(): Promise<void> {
		this.logger.info("scan-processable start");
		const videos = await this.videoRepository.listVideos();

		const pending = videos
			.filter((video) => video.status === "pending")
			.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
		const staleProcessing = videos
			.filter((video) => video.status === "processing")
			.sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));

		const video = pending[0] ?? staleProcessing[0] ?? null;
		if (!video) {
			this.logger.info("scan-processable result=none");
			return;
		}
		this.logger.info(
			{ videoId: video.id, status: video.status, title: video.title },
			"scan-processable found",
		);

		const lockPath = this.blobStorage.resolveRelativePath(
			path.posix.join("locks", `${video.id}.lock`),
		);
		await mkdir(path.dirname(lockPath), { recursive: true });

		let lockHandle: Awaited<ReturnType<typeof open>> | null = null;
		try {
			lockHandle = await open(lockPath, "wx");
		} catch (error) {
			const code = (error as { code?: string }).code;
			if (code === "EEXIST") {
				this.logger.info(
					{ videoId: video.id, reason: "already-locked" },
					"lock-skip",
				);
				return;
			}
			throw error;
		}

		if (video.status !== "processing") {
			this.logger.info({ videoId: video.id }, "mark-processing");
			await this.videoRepository.updateVideo(video.id, {
				status: "processing",
				failureReason: null,
			});
		} else {
			this.logger.info({ videoId: video.id }, "resume-processing");
		}

		try {
			this.logger.info({ videoId: video.id }, "transcode-start");
			const result = await this.ffmpegDashService.generateDashAssets(video);
			this.logger.info(
				{ videoId: video.id, segments: result.segmentCount },
				"transcode-success",
			);

			this.logger.info({ videoId: video.id }, "audio-extract-start");
			const audioResult = await this.ffmpegAudioService.extractAudio(video);
			this.logger.info(
				{ videoId: video.id, audioPath: audioResult.audioRelativePath },
				"audio-extract-success",
			);

			this.logger.info({ videoId: video.id }, "transcription-start");
			const transcriptResult = await this.transcriptionService.transcribe(
				video,
				audioResult,
			);
			this.logger.info(
				{
					videoId: video.id,
					transcriptPath: transcriptResult.transcriptRelativePath,
				},
				"transcription-complete",
			);

			this.logger.info({ videoId: video.id }, "mark-ready");
			await this.videoRepository.updateVideo(video.id, {
				status: "ready",
				segmentCount: result.segmentCount,
				transcriptRelativePath: transcriptResult.transcriptRelativePath,
				failureReason: null,
			});
			this.logger.info({ videoId: video.id, status: "ready" }, "done");
		} catch (error) {
			const failureReason = normalizeFailureMessage(error);
			this.logger.error(
				{ videoId: video.id, reason: failureReason },
				"transcode-failed",
			);
			await this.videoRepository.updateVideo(video.id, {
				status: "failed",
				failureReason,
			});
			this.logger.info({ videoId: video.id, status: "failed" }, "done");
		} finally {
			if (lockHandle) {
				await lockHandle.close();
			}
			await rm(lockPath, { force: true });
		}
	}
}
