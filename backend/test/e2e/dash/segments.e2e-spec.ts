import request from "supertest";
import { describe, expect, it } from "vitest";

import { seedReadyVideo } from "../../fixtures/seed-ready-video";
import { getE2eStorageRoot } from "../../setup-e2e";
import { useE2eApp } from "../helpers/e2e-lifecycle";

describe("DASH segments (e2e)", () => {
	const { getApp } = useE2eApp();

	it("GET /api/dash/:id/segment/* serves segment bytes for ready videos", async () => {
		const { videoId, segmentFileName } = await seedReadyVideo(
			getE2eStorageRoot(),
		);

		const response = await request(getApp().getHttpServer()).get(
			`/api/dash/${videoId}/segment/${segmentFileName}`,
		);

		expect(response.status).toBe(200);
		expect(response.headers["content-type"]).toContain("video/iso.segment");
		expect(response.body.length).toBeGreaterThan(0);
	});
});
