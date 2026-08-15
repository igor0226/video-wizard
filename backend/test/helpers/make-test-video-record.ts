import type { VideoRecord } from "../../src/storage/types";

export function makeTestVideoRecord(
	overrides: Partial<VideoRecord> = {},
): VideoRecord {
	return {
		id: "video-1",
		title: "Test",
		originalFileName: "clip.mp4",
		mimeType: "video/mp4",
		sizeBytes: 100,
		sourceRelativePath: "uploads/video-1/clip.mp4",
		dashRelativePath: "dash/video-1",
		manifestFileName: "manifest.mpd",
		status: "pending",
		segmentCount: 0,
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		failureReason: null,
		transcriptRelativePath: null,
		phrasesRelativePath: null,
		sourceLanguage: "English",
		explanationLanguage: "English",
		languageLevel: "B1",
		...overrides,
	};
}
