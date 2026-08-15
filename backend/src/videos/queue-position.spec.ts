import { describe, expect, it } from "vitest";

import type { VideoRecord } from "../storage";
import { getQueuePosition } from "./queue-position";

function makeVideo(
	id: string,
	status: VideoRecord["status"],
	createdAt: string,
): VideoRecord {
	return {
		id,
		title: id,
		originalFileName: "clip.mp4",
		mimeType: "video/mp4",
		sizeBytes: 100,
		sourceRelativePath: `uploads/${id}/clip.mp4`,
		dashRelativePath: `dash/${id}`,
		manifestFileName: "manifest.mpd",
		status,
		segmentCount: 0,
		createdAt,
		updatedAt: createdAt,
		failureReason: null,
		transcriptRelativePath: null,
	};
}

describe("getQueuePosition", () => {
	it("returns null for non-pending videos", () => {
		const video = makeVideo("a", "processing", "2026-01-01T00:00:00.000Z");
		expect(getQueuePosition(video, [video])).toBeNull();
	});

	it("returns 1-based position among pending videos by createdAt", () => {
		const videos = [
			makeVideo("oldest", "pending", "2026-01-01T00:00:00.000Z"),
			makeVideo("middle", "pending", "2026-01-01T00:01:00.000Z"),
			makeVideo("newest", "pending", "2026-01-01T00:02:00.000Z"),
			makeVideo("ready", "ready", "2026-01-01T00:03:00.000Z"),
		];

		expect(getQueuePosition(videos[0], videos)).toBe(1);
		expect(getQueuePosition(videos[1], videos)).toBe(2);
		expect(getQueuePosition(videos[2], videos)).toBe(3);
		expect(getQueuePosition(videos[3], videos)).toBeNull();
	});
});
