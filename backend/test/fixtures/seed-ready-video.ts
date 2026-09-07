import { randomUUID } from "node:crypto";
import path from "node:path";

import type { BlobStorageService } from "../../src/storage";
import type { VideoRecord } from "../../src/storage/types";
import { seedVideoMetadata } from "./seed-video-db";

const MANIFEST_FILE_NAME = "manifest.mpd";

export type SeededReadyVideo = {
	videoId: string;
	segmentFileName: string;
	title: string;
};

export async function seedReadyVideo(
	blobStorage: BlobStorageService,
	options?: { title?: string },
): Promise<SeededReadyVideo> {
	const videoId = randomUUID();
	const title = options?.title ?? "Ready fixture video";
	const segmentFileName = "chunk-video1-00001.m4s";
	const sourceFileName = "fixture.mp4";
	const sourceRelativePath = path.posix.join(
		"uploads",
		videoId,
		sourceFileName,
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
		manifestFileName: MANIFEST_FILE_NAME,
		status: "ready",
		segmentCount: 1,
		createdAt: nowIso,
		updatedAt: nowIso,
		failureReason: null,
		transcriptRelativePath: null,
		phrasesRelativePath: null,
		sourceLanguage: "English",
		explanationLanguage: "English",
		languageLevel: "B1",
	};

	const manifestContent = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<MPD xmlns="urn:mpeg:dash:schema:mpd:2011">',
		"  <Period>",
		"    <AdaptationSet>",
		'      <SegmentTemplate media="chunk-$RepresentationID$-$Number%05d$.m4s" />',
		"    </AdaptationSet>",
		"  </Period>",
		"</MPD>",
	].join("\n");

	const history = {
		videoId,
		currentStep: "completed" as const,
		events: [
			{ step: "queued" as const, status: "started" as const, at: nowIso },
			{ step: "completed" as const, status: "completed" as const, at: nowIso },
		],
		updatedAt: nowIso,
	};

	await seedVideoMetadata({ record, history });

	await blobStorage.writeText(
		path.posix.join(dashRelativePath, MANIFEST_FILE_NAME),
		manifestContent,
	);
	await blobStorage.writeUploadFile(
		path.posix.join(dashRelativePath, segmentFileName),
		Buffer.from("mock-segment-bytes"),
	);
	await blobStorage.writeUploadFile(
		sourceRelativePath,
		Buffer.from("mock-upload-bytes"),
	);

	return { videoId, segmentFileName, title };
}
