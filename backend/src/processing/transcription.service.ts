import { createReadStream } from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";
import OpenAI from "openai";

import { BlobStorageService, type VideoRecord } from "../storage";
import type { ExtractAudioResult } from "./ffmpeg-audio.service";
import {
	normalizeFfmpegError,
	runProcess,
	runProcessWithOutput,
} from "./ffmpeg-process";
import { mergeWhisperTranscripts } from "./merge-transcripts";
import type { WhisperTranscript } from "./merge-transcripts";

const WHISPER_MAX_BYTES = 24 * 1024 * 1024;
const CHUNK_DURATION_SECONDS = 600;

export type TranscribeResult = {
	transcriptRelativePath: string;
};

@Injectable()
export class WhisperTranscriptionService {
	private openaiClient: OpenAI | null = null;

	constructor(
		@InjectPinoLogger(WhisperTranscriptionService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
	) {}

	async transcribe(
		video: VideoRecord,
		audioResult: ExtractAudioResult,
	): Promise<TranscribeResult> {
		const apiKey = process.env.OPENAI_API_KEY?.trim();
		if (!apiKey) {
			throw new Error("OPENAI_API_KEY is required for transcription");
		}

		const client = this.getOpenAiClient(apiKey);
		const audioRelativePath = audioResult.audioRelativePath;
		const audioAbsolutePath =
			this.blobStorage.resolveRelativePath(audioRelativePath);
		const audioSizeBytes =
			await this.blobStorage.getFileSizeBytes(audioRelativePath);

		this.logger.info(
			{ videoId: video.id, audioSizeBytes },
			"transcription-start",
		);

		const transcript =
			audioSizeBytes <= WHISPER_MAX_BYTES
				? await this.transcribeFile(client, audioAbsolutePath)
				: await this.transcribeLargeFile(client, video.id, audioAbsolutePath);

		const transcriptRelativePath = this.blobStorage.getTranscriptRelativePath(
			video.id,
		);
		await this.blobStorage.writeJson(transcriptRelativePath, transcript);

		this.logger.info(
			{
				videoId: video.id,
				wordCount: transcript.words?.length ?? 0,
				duration: transcript.duration,
			},
			"transcription-success",
		);

		return { transcriptRelativePath };
	}

	private getOpenAiClient(apiKey: string): OpenAI {
		if (!this.openaiClient) {
			this.openaiClient = new OpenAI({ apiKey });
		}
		return this.openaiClient;
	}

	private async transcribeFile(
		client: OpenAI,
		absolutePath: string,
	): Promise<WhisperTranscript> {
		const response = await client.audio.transcriptions.create({
			file: createReadStream(absolutePath),
			model: "whisper-1",
			response_format: "verbose_json",
			timestamp_granularities: ["word", "segment"],
		});

		return response as WhisperTranscript;
	}

	private async transcribeLargeFile(
		client: OpenAI,
		videoId: string,
		audioAbsolutePath: string,
	): Promise<WhisperTranscript> {
		const durationSeconds =
			await this.getAudioDurationSeconds(audioAbsolutePath);
		const chunkCount = Math.ceil(durationSeconds / CHUNK_DURATION_SECONDS);
		const chunks: WhisperTranscript[] = [];
		const offsets: number[] = [];

		for (let index = 0; index < chunkCount; index += 1) {
			const startSeconds = index * CHUNK_DURATION_SECONDS;
			const chunkDurationSeconds = Math.min(
				CHUNK_DURATION_SECONDS,
				durationSeconds - startSeconds,
			);
			if (chunkDurationSeconds <= 0) {
				break;
			}

			const chunkRelativePath = path.posix.join(
				this.blobStorage.getAudioDirectoryRelativePath(videoId),
				`chunk-${String(index + 1).padStart(3, "0")}.mp3`,
			);
			const chunkAbsolutePath =
				this.blobStorage.resolveRelativePath(chunkRelativePath);

			await this.extractAudioChunk(
				audioAbsolutePath,
				chunkAbsolutePath,
				startSeconds,
				chunkDurationSeconds,
			);

			this.logger.info(
				{
					videoId,
					chunkIndex: index + 1,
					chunkCount,
					startSeconds,
					chunkDurationSeconds,
				},
				"transcription-chunk-start",
			);

			const chunkTranscript = await this.transcribeFile(
				client,
				chunkAbsolutePath,
			);
			chunks.push(chunkTranscript);
			offsets.push(startSeconds);
		}

		return mergeWhisperTranscripts(chunks, offsets);
	}

	private async getAudioDurationSeconds(
		audioAbsolutePath: string,
	): Promise<number> {
		try {
			const output = await runProcessWithOutput("ffprobe", [
				"-v",
				"error",
				"-show_entries",
				"format=duration",
				"-of",
				"default=noprint_wrappers=1:nokey=1",
				audioAbsolutePath,
			]);
			const duration = Number.parseFloat(output);
			if (!Number.isFinite(duration) || duration <= 0) {
				throw new Error("Invalid audio duration");
			}
			return duration;
		} catch (error) {
			throw normalizeFfmpegError(error);
		}
	}

	private async extractAudioChunk(
		sourceAbsolutePath: string,
		outputAbsolutePath: string,
		startSeconds: number,
		durationSeconds: number,
	): Promise<void> {
		const args = [
			"-y",
			"-ss",
			String(startSeconds),
			"-t",
			String(durationSeconds),
			"-i",
			sourceAbsolutePath,
			"-ac",
			"1",
			"-ar",
			"16000",
			"-c:a",
			"libmp3lame",
			"-b:a",
			"64k",
			outputAbsolutePath,
		];

		try {
			await runProcess("ffmpeg", args);
		} catch (error) {
			throw normalizeFfmpegError(error);
		}
	}
}
