import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeacherCallRecord } from "../storage/types";
import { StaleCallCleanupService } from "./stale-call-cleanup.service";
import { STALE_CALL_ENDED_REASON } from "./utils/stale-call-config";

function makeCall(
	overrides: Partial<TeacherCallRecord> = {},
): TeacherCallRecord {
	return {
		id: "call-1",
		userId: "user-1",
		roomName: "teacher-call-1",
		status: "active",
		sourceLanguage: "English",
		languageLevel: "B1",
		explanationLanguage: null,
		agentDispatchId: "disp-1",
		endedReason: null,
		createdAt: "2026-01-01T00:00:00.000Z",
		endedAt: null,
		...overrides,
	};
}

describe("StaleCallCleanupService", () => {
	const logger = { error: vi.fn() };
	const calls = {
		listActiveCallsCreatedBefore: vi.fn(async () => [] as TeacherCallRecord[]),
		markFailed: vi.fn(async () => makeCall({ status: "failed" })),
	};
	const rooms = {
		roomExists: vi.fn(async () => false),
	};
	let service: StaleCallCleanupService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new StaleCallCleanupService(
			logger as never,
			calls as never,
			rooms as never,
		);
	});

	it("skips recent calls when the repository returns none", async () => {
		calls.listActiveCallsCreatedBefore.mockResolvedValueOnce([]);
		await service.sweep();
		expect(rooms.roomExists).not.toHaveBeenCalled();
		expect(calls.markFailed).not.toHaveBeenCalled();
	});

	it("leaves a call active when the LiveKit room still exists", async () => {
		const call = makeCall();
		calls.listActiveCallsCreatedBefore.mockResolvedValueOnce([call]);
		rooms.roomExists.mockResolvedValueOnce(true);
		await service.sweep();
		expect(rooms.roomExists).toHaveBeenCalledWith(call.roomName);
		expect(calls.markFailed).not.toHaveBeenCalled();
	});

	it("marks a call failed when the LiveKit room is gone", async () => {
		const call = makeCall();
		calls.listActiveCallsCreatedBefore.mockResolvedValueOnce([call]);
		rooms.roomExists.mockResolvedValueOnce(false);
		await service.sweep();
		expect(calls.markFailed).toHaveBeenCalledWith({
			callId: call.id,
			reason: STALE_CALL_ENDED_REASON,
		});
	});

	it("continues after a LiveKit check throws", async () => {
		const first = makeCall({ id: "call-1", roomName: "teacher-1" });
		const second = makeCall({ id: "call-2", roomName: "teacher-2" });
		calls.listActiveCallsCreatedBefore.mockResolvedValueOnce([first, second]);
		rooms.roomExists
			.mockRejectedValueOnce(new Error("livekit unavailable"))
			.mockResolvedValueOnce(false);
		await service.sweep();
		expect(calls.markFailed).toHaveBeenCalledTimes(1);
		expect(calls.markFailed).toHaveBeenCalledWith({
			callId: second.id,
			reason: STALE_CALL_ENDED_REASON,
		});
		expect(logger.error).toHaveBeenCalled();
	});
});
