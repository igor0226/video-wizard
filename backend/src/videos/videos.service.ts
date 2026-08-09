import { Injectable, NotFoundException } from "@nestjs/common";

import {
	ProcessingHistoryService,
	type ProcessingHistoryEvent,
	type ProcessingStep,
	VideoRepositoryService,
	type CreateVideoInput,
	type VideoRecord,
} from "../storage";
import { getQueuePosition } from "./queue-position";

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
	processingStep: ProcessingStep;
	queuePosition: number | null;
};

export type VideoStatusForApi = {
	id: string;
	status: "pending" | "processing" | "ready" | "failed";
	failureReason: string | null;
	playable: boolean;
	chunkCount: number;
	processingStep: ProcessingStep;
	queuePosition: number | null;
	processingHistory: ProcessingHistoryEvent[];
};

@Injectable()
export class VideosService {
	constructor(
		private readonly videoRepository: VideoRepositoryService,
		private readonly processingHistory: ProcessingHistoryService,
	) {}

	async listVideosForApi(): Promise<VideoListItem[]> {
		const videos = await this.videoRepository.listVideos();
		const histories = await Promise.all(
			videos.map((video) => this.processingHistory.getHistory(video.id)),
		);

		return videos.map((video, index) => ({
			id: video.id,
			title: video.title,
			status: video.status,
			sizeBytes: video.sizeBytes,
			chunkCount: video.segmentCount,
			playable: video.status === "ready",
			createdAt: video.createdAt,
			updatedAt: video.updatedAt,
			failureReason: video.failureReason,
			processingStep: histories[index].currentStep,
			queuePosition: getQueuePosition(video, videos),
		}));
	}

	async getVideoStatusForApi(videoId: string): Promise<VideoStatusForApi> {
		const video = await this.getVideoRecordById(videoId);
		const allVideos = await this.videoRepository.listVideos();
		const history = await this.processingHistory.getHistory(videoId);

		return {
			id: video.id,
			status: video.status,
			failureReason: video.failureReason,
			playable: video.status === "ready",
			chunkCount: video.segmentCount,
			processingStep: history.currentStep,
			queuePosition: getQueuePosition(video, allVideos),
			processingHistory: history.events,
		};
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
