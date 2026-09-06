import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Video } from "../models";
import { BlobStorageService } from "./blob-storage.service";
import { ProcessingHistoryService } from "./processing-history.service";
import type { CreateVideoInput, VideoRecord } from "./types";
import { isInvalidUuidError } from "./utils/postgres-errors";
import {
	normalizeVideoRecord,
	sanitizeFileName,
	sanitizeTitle,
} from "./utils/video-record";

const UPLOADS_DIR = "uploads";
const DASH_DIR = "dash";
const MANIFEST_FILE_NAME = "manifest.mpd";

@Injectable()
export class VideoRepositoryService {
	constructor(
		@InjectRepository(Video)
		private readonly videoRepository: Repository<Video>,
		private readonly blobStorage: BlobStorageService,
		private readonly processingHistory: ProcessingHistoryService,
	) {}

	async createVideo(input: CreateVideoInput): Promise<VideoRecord> {
		await this.blobStorage.ensureLayout();

		const videoId = randomUUID();
		const safeFileName = sanitizeFileName(input.originalFileName);
		const sourceRelativePath = `${UPLOADS_DIR}/${videoId}/${safeFileName}`;
		const dashRelativePath = `${DASH_DIR}/${videoId}`;
		const nowIso = new Date().toISOString();

		const record: VideoRecord = {
			id: videoId,
			title: sanitizeTitle(input.title),
			originalFileName: safeFileName,
			mimeType: input.mimeType,
			sizeBytes: input.sizeBytes,
			sourceRelativePath,
			dashRelativePath,
			manifestFileName: MANIFEST_FILE_NAME,
			status: "pending",
			segmentCount: 0,
			createdAt: nowIso,
			updatedAt: nowIso,
			failureReason: null,
			transcriptRelativePath: null,
			phrasesRelativePath: null,
			sourceLanguage: input.sourceLanguage,
			explanationLanguage: input.explanationLanguage,
			languageLevel: input.languageLevel,
		};

		await this.blobStorage.writeUploadFile(
			sourceRelativePath,
			input.fileBuffer,
		);
		await this.videoRepository.save(record);
		await this.processingHistory.initHistory(videoId);
		return record;
	}

	async listVideos(): Promise<VideoRecord[]> {
		const records = await this.videoRepository.find({
			order: { createdAt: "DESC" },
		});
		return records.map(normalizeVideoRecord);
	}

	async getVideoById(videoId: string): Promise<VideoRecord | null> {
		try {
			const record = await this.videoRepository.findOne({
				where: { id: videoId },
			});
			return record ? normalizeVideoRecord(record) : null;
		} catch (error) {
			if (isInvalidUuidError(error)) {
				return null;
			}
			throw error;
		}
	}

	async updateVideo(
		videoId: string,
		patch: Partial<VideoRecord>,
	): Promise<VideoRecord> {
		const existing = await this.getVideoById(videoId);
		if (!existing) {
			throw new Error(`Video not found: ${videoId}`);
		}

		const updated: VideoRecord = {
			...existing,
			...patch,
			id: existing.id,
			createdAt: existing.createdAt,
			updatedAt: new Date().toISOString(),
		};

		await this.videoRepository.save(updated);
		return updated;
	}

	async getNextPendingVideo(): Promise<VideoRecord | null> {
		const record = await this.videoRepository.findOne({
			where: { status: "pending" },
			order: { createdAt: "ASC" },
		});
		return record ? normalizeVideoRecord(record) : null;
	}
}
