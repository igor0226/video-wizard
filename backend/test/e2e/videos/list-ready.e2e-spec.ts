import request from "supertest";
import { describe, expect, it } from "vitest";

import { seedReadyVideo } from "../../fixtures/seed-ready-video";
import { useE2eApp } from "../helpers/e2e-lifecycle";

describe("Videos list ready playback (e2e)", () => {
	const { getApp, getBlobStorage } = useE2eApp();

	it("GET /api/videos includes playable entries with dashManifestUrl", async () => {
		const { videoId, title } = await seedReadyVideo(getBlobStorage());

		const response = await request(getApp().getHttpServer()).get("/api/videos");

		expect(response.status).toBe(200);
		expect(response.body.videos).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: videoId,
					title,
					status: "ready",
					playable: true,
					processingStep: "completed",
					queuePosition: null,
					dashManifestUrl: `/api/dash/${videoId}/manifest`,
				}),
			]),
		);
	});
});
