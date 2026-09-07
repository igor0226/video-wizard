import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ProcessingHistory } from "../models";
import type {
	ProcessingHistoryEvent,
	ProcessingStep,
	VideoProcessingHistory,
} from "./types";
import { createDefaultHistory } from "./utils/create-default-history";

@Injectable()
export class ProcessingHistoryService {
	constructor(
		@InjectRepository(ProcessingHistory)
		private readonly historyRepository: Repository<ProcessingHistory>,
	) {}

	async initHistory(videoId: string): Promise<VideoProcessingHistory> {
		const now = new Date().toISOString();
		const history: VideoProcessingHistory = {
			videoId,
			currentStep: "queued",
			events: [{ step: "queued", status: "started", at: now }],
			updatedAt: now,
		};
		await this.historyRepository.save(history);
		return history;
	}

	async getHistory(videoId: string): Promise<VideoProcessingHistory> {
		const history = await this.historyRepository.findOne({
			where: { videoId },
		});
		if (!history) {
			return createDefaultHistory(videoId);
		}
		return {
			...createDefaultHistory(videoId),
			...history,
			videoId,
			events: history.events ?? [],
		};
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

	async recordStepComplete(input: {
		videoId: string;
		step: ProcessingStep;
		message?: string;
	}): Promise<VideoProcessingHistory> {
		const { videoId, step, message } = input;
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

	async recordFailure(input: {
		videoId: string;
		step: ProcessingStep;
		message: string;
	}): Promise<VideoProcessingHistory> {
		const { videoId, step, message } = input;
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

	async recordRetry(
		videoId: string,
		resumeFromStep: ProcessingStep,
	): Promise<VideoProcessingHistory> {
		const history = await this.getHistory(videoId);
		const now = new Date().toISOString();
		const event: ProcessingHistoryEvent = {
			step: resumeFromStep,
			status: "started",
			at: now,
			message: "retry requested",
		};
		return this.writeHistory({
			...history,
			currentStep: resumeFromStep,
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
		await this.historyRepository.save(history);
		return history;
	}
}
