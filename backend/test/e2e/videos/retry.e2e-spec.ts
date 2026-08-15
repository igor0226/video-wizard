import { access } from "node:fs/promises";
import request from "supertest";
import { describe, expect, it } from "vitest";

import {
	audioDir,
	seedFailedVideo,
	transcriptDir,
} from "../../fixtures/seed-failed-video";
import { seedReadyVideo } from "../../fixtures/seed-ready-video";
import { getE2eStorageRoot } from "../../setup-e2e";
import { useE2eApp } from "../helpers/e2e-lifecycle";

async function pathExists(absolutePath: string): Promise<boolean> {
	try {
		await access(absolutePath);
		return true;
	} catch {
		return false;
	}
}

describe("Videos retry (e2e)", () => {
	const { getApp } = useE2eApp();

	it("POST /api/videos/:id/retry returns 404 for unknown video", async () => {
		const response = await request(getApp().getHttpServer()).post(
			"/api/videos/unknown-video-id/retry",
		);

		expect(response.status).toBe(404);
	});

	it("POST /api/videos/:id/retry returns 409 for non-failed video", async () => {
		const { videoId } = await seedReadyVideo(getE2eStorageRoot());

		const response = await request(getApp().getHttpServer()).post(
			`/api/videos/${videoId}/retry`,
		);

		expect(response.status).toBe(409);
	});

	it("POST /api/videos/:id/retry queues failed video from last failed step", async () => {
		const storageRoot = getE2eStorageRoot();
		const { videoId } = await seedFailedVideo(storageRoot);

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

		expect(
			await pathExists(`${storageRoot}/${audioDir(videoId)}/track.mp3`),
		).toBe(true);
		expect(await pathExists(`${storageRoot}/${transcriptDir(videoId)}`)).toBe(
			false,
		);
	});
});
