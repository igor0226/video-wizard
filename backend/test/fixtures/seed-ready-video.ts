import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { VideoRecord } from "../../src/storage/types";

const MANIFEST_FILE_NAME = "manifest.mpd";

export type SeededReadyVideo = {
	videoId: string;
	segmentFileName: string;
	title: string;
};

export async function seedReadyVideo(
	storageRoot: string,
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

	await mkdir(path.join(storageRoot, "records"), { recursive: true });
	await mkdir(path.join(storageRoot, dashRelativePath), { recursive: true });
	await mkdir(path.dirname(path.join(storageRoot, sourceRelativePath)), {
		recursive: true,
	});

	await writeFile(
		path.join(storageRoot, "records", `${videoId}.json`),
		JSON.stringify(record, null, 2),
		"utf8",
	);
	await writeFile(
		path.join(storageRoot, dashRelativePath, MANIFEST_FILE_NAME),
		manifestContent,
		"utf8",
	);
	await writeFile(
		path.join(storageRoot, dashRelativePath, segmentFileName),
		Buffer.from("mock-segment-bytes"),
	);
	await writeFile(
		path.join(storageRoot, sourceRelativePath),
		Buffer.from("mock-upload-bytes"),
	);

	return { videoId, segmentFileName, title };
}
