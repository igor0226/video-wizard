import { Injectable, NotFoundException } from "@nestjs/common";

import {
	VideoRepositoryService,
	type CreateVideoInput,
	type VideoRecord,
} from "../storage";

export type VideoListItem = {
	id: string;
	title: string;
	status: "pending" | "processing" | "ready" | "failed";
	sizeBytes: number;
	chunkCount: number;
	playable: boolean;
	createdAt: string;
	updatedAt: string;
	failureReason: string | null;
};

@Injectable()
export class VideosService {
	constructor(private readonly videoRepository: VideoRepositoryService) {}

	async listVideosForApi(): Promise<VideoListItem[]> {
		const videos = await this.videoRepository.listVideos();
		return videos.map((video) => ({
			id: video.id,
			title: video.title,
			status: video.status,
			sizeBytes: video.sizeBytes,
			chunkCount: video.segmentCount,
			playable: video.status === "ready",
			createdAt: video.createdAt,
			updatedAt: video.updatedAt,
			failureReason: video.failureReason,
		}));
	}

	async getVideoRecordById(videoId: string): Promise<VideoRecord> {
		const video = await this.videoRepository.getVideoById(videoId);
		if (!video) {
			throw new NotFoundException("Video not found");
		}
		return video;
	}

	async createVideo(input: CreateVideoInput): Promise<VideoRecord> {
		return this.videoRepository.createVideo(input);
	}
}
