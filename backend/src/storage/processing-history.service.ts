import path from "node:path";

import { Injectable } from "@nestjs/common";

import { BlobStorageService } from "./blob-storage.service";
import type {
	ProcessingHistoryEvent,
	ProcessingStep,
	VideoProcessingHistory,
} from "./types";

const HISTORY_DIR = "history";

function toHistoryFileName(videoId: string): string {
	return `${videoId}.json`;
}

function createDefaultHistory(videoId: string): VideoProcessingHistory {
	return {
		videoId,
		currentStep: "queued",
		events: [],
		updatedAt: new Date().toISOString(),
	};
}

@Injectable()
export class ProcessingHistoryService {
	constructor(private readonly blobStorage: BlobStorageService) {}

	private getHistoryRelativePath(videoId: string): string {
		return path.posix.join(HISTORY_DIR, toHistoryFileName(videoId));
	}

	async initHistory(videoId: string): Promise<VideoProcessingHistory> {
		await this.blobStorage.ensureLayout();
		const now = new Date().toISOString();
		const history: VideoProcessingHistory = {
			videoId,
			currentStep: "queued",
			events: [{ step: "queued", status: "started", at: now }],
			updatedAt: now,
		};
		await this.writeHistory(history);
		return history;
	}

	async getHistory(videoId: string): Promise<VideoProcessingHistory> {
		await this.blobStorage.ensureLayout();
		const relativePath = this.getHistoryRelativePath(videoId);
		try {
			const content = await this.blobStorage.readText(relativePath);
			const parsed = JSON.parse(content) as Partial<VideoProcessingHistory>;
			return {
				...createDefaultHistory(videoId),
				...parsed,
				videoId,
				events: parsed.events ?? [],
			};
		} catch {
			return createDefaultHistory(videoId);
		}
	}

	async recordStepStart(
		videoId: string,
		step: ProcessingStep,
	): Promise<VideoProcessingHistory> {
		const history = await this.getHistory(videoId);
		const now = new Date().toISOString();
		const event: ProcessingHistoryEvent = { step, status: "started", at: now };
		return this.writeHistory({
			...history,
			currentStep: step,
			events: [...history.events, event],
			updatedAt: now,
		});
	}

	async recordStepComplete(
		videoId: string,
		step: ProcessingStep,
		message?: string,
	): Promise<VideoProcessingHistory> {
		const history = await this.getHistory(videoId);
		const now = new Date().toISOString();
		const event: ProcessingHistoryEvent = {
			step,
			status: "completed",
			at: now,
			...(message ? { message } : {}),
		};
		return this.writeHistory({
			...history,
			events: [...history.events, event],
			updatedAt: now,
		});
	}

	async recordFailure(
		videoId: string,
		step: ProcessingStep,
		message: string,
	): Promise<VideoProcessingHistory> {
		const history = await this.getHistory(videoId);
		const now = new Date().toISOString();
		const event: ProcessingHistoryEvent = {
			step,
			status: "failed",
			at: now,
			message,
		};
		return this.writeHistory({
			...history,
			currentStep: "failed",
			events: [...history.events, event],
			updatedAt: now,
		});
	}

	async markCompleted(videoId: string): Promise<VideoProcessingHistory> {
		const history = await this.getHistory(videoId);
		const now = new Date().toISOString();
		const event: ProcessingHistoryEvent = {
			step: "completed",
			status: "completed",
			at: now,
		};
		return this.writeHistory({
			...history,
			currentStep: "completed",
			events: [...history.events, event],
			updatedAt: now,
		});
	}

	private async writeHistory(
		history: VideoProcessingHistory,
	): Promise<VideoProcessingHistory> {
		await this.blobStorage.writeJson(
			this.getHistoryRelativePath(history.videoId),
			history,
		);
		return history;
	}
}
