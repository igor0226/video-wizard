import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Res,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { memoryStorage } from "multer";
import { VideosService } from "./videos.service";

@Controller("videos")
export class VideosController {
	constructor(private readonly videosService: VideosService) {}

	@Get()
	async listVideos() {
		const videos = await this.videosService.listVideosForApi();
		const payload = videos.map((video) => ({
			...video,
			dashManifestUrl: video.playable ? `/api/dash/${video.id}/manifest` : null,
		}));
		return { videos: payload };
	}

	@Get(":id/status")
	async getStatus(@Param("id") id: string) {
		return this.videosService.getVideoStatusForApi(id);
	}

	@Post("upload")
	@UseInterceptors(
		FileInterceptor("file", {
			storage: memoryStorage(),
			limits: { fileSize: 1024 * 1024 * 1024 },
		}),
	)
	async upload(
		@UploadedFile() file: Express.Multer.File | undefined,
		@Body("title") title: string | undefined,
		@Res() res: Response,
	) {
		try {
			if (typeof title !== "string" || !title.trim()) {
				return res.status(400).send("Video name is required");
			}

			if (!file) {
				return res.status(400).send("Video file is required");
			}

			const originalName = file.originalname || "upload.mp4";
			if (
				!file.mimetype.startsWith("video/") &&
				!originalName.toLowerCase().endsWith(".mp4")
			) {
				return res.status(400).send("Only video files are allowed");
			}

			const record = await this.videosService.createVideo({
				title,
				originalFileName: originalName,
				mimeType: file.mimetype || "application/octet-stream",
				sizeBytes: file.size,
				fileBuffer: file.buffer,
			});

			return res.status(200).json({
				id: record.id,
				title: record.title,
				status: record.status,
				sizeBytes: record.sizeBytes,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "Upload failed";
			return res.status(500).send(message);
		}
	}
}
