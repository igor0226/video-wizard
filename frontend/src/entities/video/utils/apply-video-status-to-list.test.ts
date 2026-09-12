import type { VideoItem, VideoStatusResponse } from "../model/types";

import { describe, expect, it } from "vitest";

import { applyVideoStatusToList } from "./apply-video-status-to-list";

const video = {
	id: "video-1",
	status: "processing",
	playable: false,
} as VideoItem;

const status = {
	status: "ready",
	playable: true,
	chunkCount: 2,
	failureReason: null,
	processingStep: "completed",
	queuePosition: null,
	sourceLanguage: "English",
	explanationLanguage: "Spanish",
	languageLevel: "B1",
} as VideoStatusResponse;

describe("applyVideoStatusToList", () => {
	it("returns undefined when the list cache is empty", () => {
		expect(
			applyVideoStatusToList({
				previous: undefined,
				videoId: "video-1",
				status,
			}),
		).toBeUndefined();
	});

	it("patches the matching video", () => {
		const next = applyVideoStatusToList({
			previous: { videos: [video] },
			videoId: "video-1",
			status,
		});
		expect(next?.videos[0]).toMatchObject({
			id: "video-1",
			status: "ready",
			playable: true,
			languageLevel: "B1",
		});
	});
});
