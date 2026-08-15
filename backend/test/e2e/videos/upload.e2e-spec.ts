import request from "supertest";
import { describe, expect, it } from "vitest";

import { useE2eApp } from "../helpers/e2e-lifecycle";

const UPLOAD_FIELDS = {
	title: "Pending clip",
	sourceLanguage: "Spanish",
	explanationLanguage: "English",
	languageLevel: "B1",
};

describe("Videos upload (e2e)", () => {
	const { getApp } = useE2eApp();

	it("POST /api/videos/upload returns 400 when title is missing", async () => {
		const response = await request(getApp().getHttpServer())
			.post("/api/videos/upload")
			.field("sourceLanguage", "Spanish")
			.field("explanationLanguage", "English")
			.field("languageLevel", "B1")
			.attach("file", Buffer.from("fake"), "clip.mp4");

		expect(response.status).toBe(400);
		expect(response.text).toBe("Video name is required");
	});

	it("POST /api/videos/upload returns 400 when file is missing", async () => {
		const response = await request(getApp().getHttpServer())
			.post("/api/videos/upload")
			.field("title", "My clip")
			.field("sourceLanguage", "Spanish")
			.field("explanationLanguage", "English")
			.field("languageLevel", "B1");

		expect(response.status).toBe(400);
		expect(response.text).toBe("Video file is required");
	});

	it("POST /api/videos/upload returns 400 when language fields are missing", async () => {
		const response = await request(getApp().getHttpServer())
			.post("/api/videos/upload")
			.field("title", "My clip")
			.attach("file", Buffer.from("fake-video-bytes"), {
				filename: "clip.mp4",
				contentType: "video/mp4",
			});

		expect(response.status).toBe(400);
		expect(response.text).toBe("Source language is required");
	});

	it("POST /api/videos/upload returns 400 for invalid language level", async () => {
		const response = await request(getApp().getHttpServer())
			.post("/api/videos/upload")
			.field("title", "My clip")
			.field("sourceLanguage", "Spanish")
			.field("explanationLanguage", "English")
			.field("languageLevel", "beginner")
			.attach("file", Buffer.from("fake-video-bytes"), {
				filename: "clip.mp4",
				contentType: "video/mp4",
			});

		expect(response.status).toBe(400);
		expect(response.text).toBe(
			"Language level is required (A1, A2, B1, B2, C1, or C2)",
		);
	});

	it("POST /api/videos/upload creates a pending video", async () => {
		const uploadResponse = await request(getApp().getHttpServer())
			.post("/api/videos/upload")
			.field("title", UPLOAD_FIELDS.title)
			.field("sourceLanguage", UPLOAD_FIELDS.sourceLanguage)
			.field("explanationLanguage", UPLOAD_FIELDS.explanationLanguage)
			.field("languageLevel", UPLOAD_FIELDS.languageLevel)
			.attach("file", Buffer.from("fake-video-bytes"), {
				filename: "clip.mp4",
				contentType: "video/mp4",
			});

		expect(uploadResponse.status).toBe(200);
		expect(uploadResponse.body).toMatchObject({
			title: UPLOAD_FIELDS.title,
			status: "pending",
			sourceLanguage: UPLOAD_FIELDS.sourceLanguage,
			explanationLanguage: UPLOAD_FIELDS.explanationLanguage,
			languageLevel: UPLOAD_FIELDS.languageLevel,
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
			sourceLanguage: UPLOAD_FIELDS.sourceLanguage,
			explanationLanguage: UPLOAD_FIELDS.explanationLanguage,
			languageLevel: UPLOAD_FIELDS.languageLevel,
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
					sourceLanguage: UPLOAD_FIELDS.sourceLanguage,
				}),
			]),
		);

		const manifestResponse = await request(getApp().getHttpServer()).get(
			`/api/dash/${pendingId}/manifest.mpd`,
		);
		expect(manifestResponse.status).toBe(404);
	});
});
