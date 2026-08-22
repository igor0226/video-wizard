import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import request from "supertest";
import { describe, expect, it } from "vitest";

import { seedReadyVideo } from "../../fixtures/seed-ready-video";
import { getE2eStorageRoot } from "../../setup-e2e";
import { useE2eApp } from "../helpers/e2e-lifecycle";

describe("Videos playback phrases (e2e)", () => {
	const { getApp } = useE2eApp();

	it("GET /api/videos/:id/playback-phrases returns 404 for unknown video", async () => {
		const response = await request(getApp().getHttpServer()).get(
			"/api/videos/unknown-video-id/playback-phrases",
		);

		expect(response.status).toBe(404);
	});

	it("GET /api/videos/:id/playback-phrases returns empty phrases when not composed", async () => {
		const { videoId } = await seedReadyVideo(getE2eStorageRoot());

		const response = await request(getApp().getHttpServer()).get(
			`/api/videos/${videoId}/playback-phrases`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ videoId, phrases: [] });
	});

	it("GET /api/videos/:id/playback-phrases returns stored playback phrases", async () => {
		const { videoId } = await seedReadyVideo(getE2eStorageRoot());
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
		const enrichedDirectory = path.join(
			getE2eStorageRoot(),
			"enriched",
			videoId,
		);
		await mkdir(enrichedDirectory, { recursive: true });
		await writeFile(
			path.join(enrichedDirectory, "playback-phrases.json"),
			JSON.stringify(playbackPhrases, null, 2),
			"utf8",
		);

		const response = await request(getApp().getHttpServer()).get(
			`/api/videos/${videoId}/playback-phrases`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ videoId, ...playbackPhrases });
	});
});
