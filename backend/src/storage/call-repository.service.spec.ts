import { LessThan } from "typeorm";
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

	it("listActiveCallsCreatedBefore queries old active calls", async () => {
		const createdBefore = "2026-01-01T00:02:00.000Z";
		const stale: TeacherCallRecord = {
			id: "stale-1",
			userId: "user-1",
			roomName: "teacher-stale-1",
			status: "active",
			sourceLanguage: "English",
			languageLevel: "A2",
			explanationLanguage: null,
			agentDispatchId: null,
			endedReason: null,
			createdAt: "2026-01-01T00:00:00.000Z",
			endedAt: null,
		};
		repo.find.mockResolvedValueOnce([stale]);

		const records = await service.listActiveCallsCreatedBefore({
			createdBefore,
		});

		expect(records).toEqual([stale]);
		expect(repo.find).toHaveBeenCalledWith({
			where: {
				status: "active",
				createdAt: LessThan(createdBefore),
			},
			order: { createdAt: "ASC" },
		});
	});
});
