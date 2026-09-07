import type { Readable } from "node:stream";

import {
	CreateBucketCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadBucketCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Inject, Injectable } from "@nestjs/common";

import type { ProcessingStep, VideoRecord } from "./types";
import { normalizeObjectKey } from "./utils/normalize-object-key";
import { S3_CLIENT, S3_CONFIG } from "./s3-client.provider";
import type { S3Config } from "./utils/resolve-s3-config";

const DASH_DIR = "dash";
const AUDIO_DIR = "audio";
const TRANSCRIPTS_DIR = "transcripts";
const EXPLANATIONS_DIR = "explanations";
const ENRICHED_DIR = "enriched";
const ASSETS_DIR = "assets";
const LISTEN_AGAIN_DIR = "listen-again";
const MULTIPART_THRESHOLD_BYTES = 5 * 1024 * 1024;

function isNotFoundError(error: unknown): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	const maybeError = error as {
		name?: string;
		$metadata?: { httpStatusCode?: number };
	};
	return (
		maybeError.name === "NotFound" ||
		maybeError.name === "NoSuchKey" ||
		maybeError.$metadata?.httpStatusCode === 404
	);
}

@Injectable()
export class BlobStorageService {
	constructor(
		@Inject(S3_CLIENT) private readonly s3Client: S3Client,
		@Inject(S3_CONFIG) private readonly s3Config: S3Config,
	) {}

	getBucketName(): string {
		return this.s3Config.bucket;
	}

	async ensureLayout(): Promise<void> {
		try {
			await this.s3Client.send(
				new HeadBucketCommand({ Bucket: this.s3Config.bucket }),
			);
		} catch {
			await this.s3Client.send(
				new CreateBucketCommand({ Bucket: this.s3Config.bucket }),
			);
		}
	}

	async writeUploadFile(
		relativePath: string,
		fileBuffer: Buffer,
	): Promise<void> {
		const key = normalizeObjectKey(relativePath);
		if (fileBuffer.length >= MULTIPART_THRESHOLD_BYTES) {
			const upload = new Upload({
				client: this.s3Client,
				params: {
					Bucket: this.s3Config.bucket,
					Key: key,
					Body: fileBuffer,
				},
			});
			await upload.done();
			return;
		}

		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.s3Config.bucket,
				Key: key,
				Body: fileBuffer,
			}),
		);
	}

	async readText(relativePath: string): Promise<string> {
		const buffer = await this.readBytes(relativePath);
		return buffer.toString("utf8");
	}

	async writeText(relativePath: string, contents: string): Promise<void> {
		await this.writeUploadFile(relativePath, Buffer.from(contents, "utf8"));
	}

	async readBytes(relativePath: string): Promise<Buffer> {
		const response = await this.s3Client.send(
			new GetObjectCommand({
				Bucket: this.s3Config.bucket,
				Key: normalizeObjectKey(relativePath),
			}),
		);
		if (!response.Body) {
			throw new Error(`Object not found: ${relativePath}`);
		}
		return Buffer.from(await response.Body.transformToByteArray());
	}

	async writeJson(relativePath: string, data: unknown): Promise<void> {
		await this.writeText(relativePath, JSON.stringify(data, null, 2));
	}

	async getFileSizeBytes(relativePath: string): Promise<number> {
		const response = await this.s3Client.send(
			new HeadObjectCommand({
				Bucket: this.s3Config.bucket,
				Key: normalizeObjectKey(relativePath),
			}),
		);
		return response.ContentLength ?? 0;
	}

	async fileExists(relativePath: string): Promise<boolean> {
		try {
			await this.s3Client.send(
				new HeadObjectCommand({
					Bucket: this.s3Config.bucket,
					Key: normalizeObjectKey(relativePath),
				}),
			);
			return true;
		} catch (error) {
			if (isNotFoundError(error)) {
				return false;
			}
			throw error;
		}
	}

	async listFiles(relativePath: string): Promise<string[]> {
		const prefix = this.toPrefix(relativePath);
		const response = await this.s3Client.send(
			new ListObjectsV2Command({
				Bucket: this.s3Config.bucket,
				Prefix: prefix,
				Delimiter: "/",
			}),
		);
		return (response.Contents ?? [])
			.map((entry) => entry.Key ?? "")
			.filter((key) => key && !key.endsWith("/"))
			.map((key) => key.slice(prefix.length));
	}

	async listObjectKeys(prefix: string): Promise<string[]> {
		const normalizedPrefix = this.toPrefix(prefix);
		const keys: string[] = [];
		let continuationToken: string | undefined;

		do {
			const response = await this.s3Client.send(
				new ListObjectsV2Command({
					Bucket: this.s3Config.bucket,
					Prefix: normalizedPrefix,
					ContinuationToken: continuationToken,
				}),
			);
			for (const entry of response.Contents ?? []) {
				if (entry.Key && !entry.Key.endsWith("/")) {
					keys.push(entry.Key);
				}
			}
			continuationToken = response.NextContinuationToken;
		} while (continuationToken);

		return keys;
	}

	async getObjectStream(relativePath: string): Promise<Readable> {
		const response = await this.s3Client.send(
			new GetObjectCommand({
				Bucket: this.s3Config.bucket,
				Key: normalizeObjectKey(relativePath),
			}),
		);
		if (!response.Body) {
			throw new Error(`Object not found: ${relativePath}`);
		}
		return response.Body as Readable;
	}

	async ensureCleanDirectory(relativePath: string): Promise<void> {
		await this.deletePrefix(relativePath);
	}

	getAudioRelativePath(videoId: string): string {
		return `${AUDIO_DIR}/${videoId}/track.mp3`;
	}

	getUploadDirectoryRelativePath(videoId: string): string {
		return `uploads/${videoId}`;
	}

	getAudioDirectoryRelativePath(videoId: string): string {
		return `${AUDIO_DIR}/${videoId}`;
	}

	getTranscriptRelativePath(videoId: string): string {
		return `${TRANSCRIPTS_DIR}/${videoId}/transcript.json`;
	}

	getTranscriptDirectoryRelativePath(videoId: string): string {
		return `${TRANSCRIPTS_DIR}/${videoId}`;
	}

	getPhrasesRelativePath(videoId: string): string {
		return `${EXPLANATIONS_DIR}/${videoId}/phrases.json`;
	}

	getExplanationsDirectoryRelativePath(videoId: string): string {
		return `${EXPLANATIONS_DIR}/${videoId}`;
	}

	getClipsManifestRelativePath(videoId: string): string {
		return `${EXPLANATIONS_DIR}/${videoId}/clips.json`;
	}

	getClipsDirectoryRelativePath(videoId: string): string {
		return `${EXPLANATIONS_DIR}/${videoId}/clips`;
	}

	getEnrichedDirectoryRelativePath(videoId: string): string {
		return `${ENRICHED_DIR}/${videoId}`;
	}

	getEnrichedVideoRelativePath(videoId: string): string {
		return `${ENRICHED_DIR}/${videoId}/output.mp4`;
	}

	getPlaybackPhrasesRelativePath(videoId: string): string {
		return `${ENRICHED_DIR}/${videoId}/playback-phrases.json`;
	}

	getListenAgainAssetRelativePath(language: string): string {
		return `${ASSETS_DIR}/${LISTEN_AGAIN_DIR}/${language}.mp3`;
	}

	getDashDirectoryRelativePath(videoId: string): string {
		return `${DASH_DIR}/${videoId}`;
	}

	getDashManifestRelativePath(video: VideoRecord): string {
		return `${video.dashRelativePath}/${video.manifestFileName}`;
	}

	async clearProcessingArtifactsFromStep(
		videoId: string,
		fromStep: ProcessingStep,
	): Promise<void> {
		const directories: string[] = [];
		const files: string[] = [];

		if (fromStep === "audio_extract") {
			directories.push(
				this.getAudioDirectoryRelativePath(videoId),
				this.getTranscriptDirectoryRelativePath(videoId),
				this.getExplanationsDirectoryRelativePath(videoId),
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
		} else if (fromStep === "transcribing") {
			directories.push(
				this.getTranscriptDirectoryRelativePath(videoId),
				this.getExplanationsDirectoryRelativePath(videoId),
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
		} else if (fromStep === "detecting_phrases") {
			directories.push(
				this.getExplanationsDirectoryRelativePath(videoId),
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
		} else if (fromStep === "generating_clips") {
			directories.push(
				this.getClipsDirectoryRelativePath(videoId),
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
			files.push(this.getClipsManifestRelativePath(videoId));
		} else if (fromStep === "composing_video") {
			directories.push(
				this.getEnrichedDirectoryRelativePath(videoId),
				this.getDashDirectoryRelativePath(videoId),
			);
		} else if (fromStep === "dash_encoding") {
			directories.push(this.getDashDirectoryRelativePath(videoId));
		}

		await Promise.all([
			...directories.map((relativePath) => this.deletePrefix(relativePath)),
			...files.map((relativePath) => this.deleteObject(relativePath)),
		]);
	}

	private toPrefix(relativePath: string): string {
		const key = normalizeObjectKey(relativePath);
		return key.endsWith("/") ? key : `${key}/`;
	}

	private async deleteObject(relativePath: string): Promise<void> {
		if (!(await this.fileExists(relativePath))) {
			return;
		}
		await this.s3Client.send(
			new DeleteObjectsCommand({
				Bucket: this.s3Config.bucket,
				Delete: {
					Objects: [{ Key: normalizeObjectKey(relativePath) }],
				},
			}),
		);
	}

	private async deletePrefix(relativePath: string): Promise<void> {
		const prefix = this.toPrefix(relativePath);
		let continuationToken: string | undefined;

		do {
			const response = await this.s3Client.send(
				new ListObjectsV2Command({
					Bucket: this.s3Config.bucket,
					Prefix: prefix,
					ContinuationToken: continuationToken,
				}),
			);
			const objects = (response.Contents ?? [])
				.filter((entry) => entry.Key)
				.map((entry) => ({ Key: entry.Key as string }));

			if (objects.length > 0) {
				await this.s3Client.send(
					new DeleteObjectsCommand({
						Bucket: this.s3Config.bucket,
						Delete: { Objects: objects },
					}),
				);
			}

			continuationToken = response.NextContinuationToken;
		} while (continuationToken);
	}
}
