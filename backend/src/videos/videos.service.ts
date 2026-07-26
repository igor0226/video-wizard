import type { CreateVideoInput, VideoRecord } from "../storage";

import { Injectable, NotFoundException } from "@nestjs/common";

import { videoRepository } from "../storage";

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
	async listVideosForApi(): Promise<VideoListItem[]> {
		const videos = await videoRepository.listVideos();
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
		const video = await videoRepository.getVideoById(videoId);
		if (!video) {
			throw new NotFoundException("Video not found");
		}
		return video;
	}

	async createVideo(input: CreateVideoInput): Promise<VideoRecord> {
		return videoRepository.createVideo(input);
	}
}
