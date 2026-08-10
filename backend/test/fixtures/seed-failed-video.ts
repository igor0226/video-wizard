import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { VideoRecord } from "../../src/storage/types";

export type SeededFailedVideo = {
	videoId: string;
	title: string;
};

export async function seedFailedVideo(
	storageRoot: string,
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
	};

	const history = {
		videoId,
		currentStep: "failed",
		events: [
			{ step: "queued", status: "started", at: nowIso },
			{ step: "audio_extract", status: "completed", at: nowIso },
			{
				step: "transcribing",
				status: "failed",
				at: nowIso,
				message: "Whisper failed",
			},
		],
		updatedAt: nowIso,
	};

	await mkdir(path.join(storageRoot, "records"), { recursive: true });
	await mkdir(path.dirname(path.join(storageRoot, sourceRelativePath)), {
		recursive: true,
	});
	await mkdir(path.dirname(path.join(storageRoot, audioRelativePath)), {
		recursive: true,
	});
	await mkdir(path.dirname(path.join(storageRoot, transcriptRelativePath)), {
		recursive: true,
	});

	await writeFile(
		path.join(storageRoot, "records", `${videoId}.json`),
		JSON.stringify(record, null, 2),
		"utf8",
	);
	await writeFile(
		path.join(storageRoot, sourceRelativePath),
		Buffer.from("mock-upload-bytes"),
	);
	await writeFile(
		path.join(storageRoot, audioRelativePath),
		Buffer.from("mock-audio-bytes"),
	);
	await writeFile(
		path.join(storageRoot, transcriptRelativePath),
		Buffer.from("{}"),
	);
	await mkdir(path.join(storageRoot, "history"), { recursive: true });
	await writeFile(
		path.join(storageRoot, "history", `${videoId}.json`),
		JSON.stringify(history, null, 2),
		"utf8",
	);

	return { videoId, title };
}

export function audioDir(videoId: string): string {
	return path.posix.join("audio", videoId);
}

export function transcriptDir(videoId: string): string {
	return path.posix.join("transcripts", videoId);
}
