import { randomUUID } from "node:crypto";
import path from "node:path";

import type { BlobStorageService } from "../../src/storage";
import type { VideoRecord } from "../../src/storage/types";
import { seedVideoMetadata } from "./seed-video-db";

export type SeededFailedVideo = {
	videoId: string;
	title: string;
};

export async function seedFailedVideo(
	blobStorage: BlobStorageService,
	options?: { title?: string },
): Promise<SeededFailedVideo> {
	const videoId = randomUUID();
	const title = options?.title ?? "Failed fixture video";
	const sourceFileName = "fixture.mp4";
	const sourceRelativePath = path.posix.join(
		"uploads",
		videoId,
		sourceFileName,
	);
	const audioRelativePath = path.posix.join(audioDir(videoId), "track.mp3");
	const transcriptRelativePath = path.posix.join(
		transcriptDir(videoId),
		"transcript.json",
	);
	const dashRelativePath = path.posix.join("dash", videoId);
	const nowIso = new Date().toISOString();

	const record: VideoRecord = {
		id: videoId,
		title,
		originalFileName: sourceFileName,
		mimeType: "video/mp4",
		sizeBytes: 12,
		sourceRelativePath,
		dashRelativePath,
		manifestFileName: "manifest.mpd",
		status: "failed",
		segmentCount: 0,
		createdAt: nowIso,
		updatedAt: nowIso,
		failureReason: "Whisper failed",
		transcriptRelativePath: null,
		phrasesRelativePath: null,
		sourceLanguage: "English",
		explanationLanguage: "English",
		languageLevel: "B1",
	};

	const history = {
		videoId,
		currentStep: "failed" as const,
		events: [
			{ step: "queued" as const, status: "started" as const, at: nowIso },
			{
				step: "audio_extract" as const,
				status: "completed" as const,
				at: nowIso,
			},
			{
				step: "transcribing" as const,
				status: "failed" as const,
				at: nowIso,
				message: "Whisper failed",
			},
		],
		updatedAt: nowIso,
	};

	await seedVideoMetadata({ record, history });

	await blobStorage.writeUploadFile(
		sourceRelativePath,
		Buffer.from("mock-upload-bytes"),
	);
	await blobStorage.writeUploadFile(
		audioRelativePath,
		Buffer.from("mock-audio-bytes"),
	);
	await blobStorage.writeText(transcriptRelativePath, "{}");

	return { videoId, title };
}

export function audioDir(videoId: string): string {
	return path.posix.join("audio", videoId);
}

export function transcriptDir(videoId: string): string {
	return path.posix.join("transcripts", videoId);
}
