import request from "supertest";
import { describe, expect, it } from "vitest";

import { useE2eApp } from "../helpers/e2e-lifecycle";

describe("Videos upload (e2e)", () => {
	const { getApp } = useE2eApp();

	it("POST /api/videos/upload returns 400 when title is missing", async () => {
		const response = await request(getApp().getHttpServer())
			.post("/api/videos/upload")
			.attach("file", Buffer.from("fake"), "clip.mp4");

		expect(response.status).toBe(400);
		expect(response.text).toBe("Video name is required");
	});

	it("POST /api/videos/upload returns 400 when file is missing", async () => {
		const response = await request(getApp().getHttpServer())
			.post("/api/videos/upload")
			.field("title", "My clip");

		expect(response.status).toBe(400);
		expect(response.text).toBe("Video file is required");
	});

	it("POST /api/videos/upload creates a pending video", async () => {
		const uploadResponse = await request(getApp().getHttpServer())
			.post("/api/videos/upload")
			.field("title", "Pending clip")
			.attach("file", Buffer.from("fake-video-bytes"), {
				filename: "clip.mp4",
				contentType: "video/mp4",
			});

		expect(uploadResponse.status).toBe(200);
		expect(uploadResponse.body).toMatchObject({
			title: "Pending clip",
			status: "pending",
		});
		expect(uploadResponse.body.id).toEqual(expect.any(String));

		const pendingId = uploadResponse.body.id as string;

		const statusResponse = await request(getApp().getHttpServer()).get(
			`/api/videos/${pendingId}/status`,
		);
		expect(statusResponse.status).toBe(200);
		expect(statusResponse.body).toMatchObject({
			id: pendingId,
			status: "pending",
			playable: false,
		});

		const listResponse = await request(getApp().getHttpServer()).get(
			"/api/videos",
		);
		expect(listResponse.status).toBe(200);
		expect(listResponse.body.videos).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: pendingId,
					status: "pending",
					playable: false,
					dashManifestUrl: null,
				}),
			]),
		);

		const manifestResponse = await request(getApp().getHttpServer()).get(
			`/api/dash/${pendingId}/manifest.mpd`,
		);
		expect(manifestResponse.status).toBe(404);
	});
});
