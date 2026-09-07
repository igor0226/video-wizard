import request from "supertest";
import { describe, expect, it } from "vitest";

import {
	audioDir,
	seedFailedVideo,
	transcriptDir,
} from "../../fixtures/seed-failed-video";
import { seedReadyVideo } from "../../fixtures/seed-ready-video";
import { useE2eApp } from "../helpers/e2e-lifecycle";

describe("Videos retry (e2e)", () => {
	const { getApp, getBlobStorage } = useE2eApp();

	it("POST /api/videos/:id/retry returns 404 for unknown video", async () => {
		const response = await request(getApp().getHttpServer()).post(
			"/api/videos/unknown-video-id/retry",
		);

		expect(response.status).toBe(404);
	});

	it("POST /api/videos/:id/retry returns 409 for non-failed video", async () => {
		const { videoId } = await seedReadyVideo(getBlobStorage());

		const response = await request(getApp().getHttpServer()).post(
			`/api/videos/${videoId}/retry`,
		);

		expect(response.status).toBe(409);
	});

	it("POST /api/videos/:id/retry queues failed video from last failed step", async () => {
		const blobStorage = getBlobStorage();
		const { videoId } = await seedFailedVideo(blobStorage);

		const response = await request(getApp().getHttpServer()).post(
			`/api/videos/${videoId}/retry`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			id: videoId,
			status: "pending",
			resumeFromStep: "transcribing",
			failureReason: null,
		});

		const statusResponse = await request(getApp().getHttpServer()).get(
			`/api/videos/${videoId}/status`,
		);
		expect(statusResponse.body).toMatchObject({
			status: "pending",
			failureReason: null,
			processingStep: "transcribing",
		});
		expect(statusResponse.body.processingHistory).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					step: "transcribing",
					status: "started",
					message: "retry requested",
				}),
			]),
		);

		expect(await blobStorage.fileExists(`${audioDir(videoId)}/track.mp3`)).toBe(
			true,
		);
		expect(await blobStorage.fileExists(transcriptDir(videoId))).toBe(false);
	});
});
