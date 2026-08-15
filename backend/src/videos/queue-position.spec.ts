import { describe, expect, it } from "vitest";

import type { VideoRecord } from "../storage";
import { makeTestVideoRecord } from "../../test/helpers/make-test-video-record";
import { getQueuePosition } from "./queue-position";

function makeVideo(input: {
	id: string;
	status: VideoRecord["status"];
	createdAt: string;
}): VideoRecord {
	return makeTestVideoRecord({
		id: input.id,
		title: input.id,
		status: input.status,
		createdAt: input.createdAt,
		updatedAt: input.createdAt,
	});
}

describe("getQueuePosition", () => {
	it("returns null for non-pending videos", () => {
		const video = makeVideo({
			id: "a",
			status: "processing",
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		expect(getQueuePosition(video, [video])).toBeNull();
	});

	it("returns 1-based position among pending videos by createdAt", () => {
		const videos = [
			makeVideo({
				id: "oldest",
				status: "pending",
				createdAt: "2026-01-01T00:00:00.000Z",
			}),
			makeVideo({
				id: "middle",
				status: "pending",
				createdAt: "2026-01-01T00:01:00.000Z",
			}),
			makeVideo({
				id: "newest",
				status: "pending",
				createdAt: "2026-01-01T00:02:00.000Z",
			}),
			makeVideo({
				id: "ready",
				status: "ready",
				createdAt: "2026-01-01T00:03:00.000Z",
			}),
		];

		expect(getQueuePosition(videos[0], videos)).toBe(1);
		expect(getQueuePosition(videos[1], videos)).toBe(2);
		expect(getQueuePosition(videos[2], videos)).toBe(3);
		expect(getQueuePosition(videos[3], videos)).toBeNull();
	});
});
