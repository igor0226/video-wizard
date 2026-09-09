import { beforeEach, describe, expect, it, vi } from "vitest";

import { CallRepositoryService } from "./call-repository.service";
import type { TeacherCallRecord } from "./types";

describe("CallRepositoryService", () => {
	const saved: TeacherCallRecord[] = [];
	const repo = {
		save: vi.fn(async (record: TeacherCallRecord) => {
			saved.splice(0, saved.length, record);
			return record;
		}),
		findOne: vi.fn(async () => saved[0] ?? null),
		find: vi.fn(async () => saved),
	};
	let service: CallRepositoryService;

	beforeEach(() => {
		vi.clearAllMocks();
		saved.length = 0;
		service = new CallRepositoryService(repo as never);
	});

	it("createCall stores an active teacher call", async () => {
		const record = await service.createCall({
			userId: "user-1",
			sourceLanguage: "English",
			languageLevel: "A2",
			explanationLanguage: "Spanish",
		});
		expect(record.status).toBe("active");
		expect(record.roomName).toBe(`teacher-${record.id}`);
		expect(record.userId).toBe("user-1");
		expect(repo.save).toHaveBeenCalled();
	});

	it("markEnded sets status, reason, and endedAt", async () => {
		await service.createCall({
			userId: "user-1",
			sourceLanguage: "English",
			languageLevel: "A2",
		});
		const created = saved[0];
		repo.findOne.mockResolvedValue(created);
		const ended = await service.markEnded({
			callId: created.id,
			reason: "user_ended",
		});
		expect(ended.status).toBe("ended");
		expect(ended.endedReason).toBe("user_ended");
		expect(ended.endedAt).toBeTruthy();
	});
});
