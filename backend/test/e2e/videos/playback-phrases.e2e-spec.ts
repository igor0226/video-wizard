import request from "supertest";
import { describe, expect, it } from "vitest";

import { seedReadyVideo } from "../../fixtures/seed-ready-video";
import { useE2eApp } from "../helpers/e2e-lifecycle";

describe("Videos playback phrases (e2e)", () => {
	const { getApp, getBlobStorage } = useE2eApp();

	it("GET /api/videos/:id/playback-phrases returns 404 for unknown video", async () => {
		const response = await request(getApp().getHttpServer()).get(
			"/api/videos/unknown-video-id/playback-phrases",
		);

		expect(response.status).toBe(404);
	});

	it("GET /api/videos/:id/playback-phrases returns empty phrases when not composed", async () => {
		const { videoId } = await seedReadyVideo(getBlobStorage());

		const response = await request(getApp().getHttpServer()).get(
			`/api/videos/${videoId}/playback-phrases`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ videoId, phrases: [] });
	});

	it("GET /api/videos/:id/playback-phrases returns stored playback phrases", async () => {
		const blobStorage = getBlobStorage();
		const { videoId } = await seedReadyVideo(blobStorage);
		const playbackPhrases = {
			phrases: [
				{
					index: 0,
					phrase: "break the ice",
					explanation: "Start a conversation in a friendly way.",
					startSeconds: 10,
					endSeconds: 13.5,
				},
			],
		};
		await blobStorage.writeJson(
			blobStorage.getPlaybackPhrasesRelativePath(videoId),
			playbackPhrases,
		);

		const response = await request(getApp().getHttpServer()).get(
			`/api/videos/${videoId}/playback-phrases`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ videoId, ...playbackPhrases });
	});
});
