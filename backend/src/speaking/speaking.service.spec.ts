import {
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TeacherCallRecord } from "../storage/types";
import { SpeakingService } from "./speaking.service";

function makeCall(
	overrides: Partial<TeacherCallRecord> = {},
): TeacherCallRecord {
	return {
		id: "11111111-1111-1111-1111-111111111111",
		userId: "user-1",
		roomName: "teacher-11111111-1111-1111-1111-111111111111",
		status: "active",
		sourceLanguage: "English",
		languageLevel: "B1",
		explanationLanguage: "Spanish",
		agentDispatchId: null,
		endedReason: null,
		createdAt: "2026-01-01T00:00:00.000Z",
		endedAt: null,
		...overrides,
	};
}

describe("SpeakingService", () => {
	const call = makeCall();
	const calls = {
		createCall: vi.fn(async () => call),
		setAgentDispatchId: vi.fn(async () => ({
			...call,
			agentDispatchId: "disp-1",
		})),
		markFailed: vi.fn(async () => ({ ...call, status: "failed" as const })),
		markEnded: vi.fn(async () => ({ ...call, status: "ended" as const })),
		getCall: vi.fn(async (): Promise<TeacherCallRecord | null> => call),
		listCallsForUser: vi.fn(async () => [call]),
	};
	const tokens = {
		createParticipantToken: vi.fn(async () => "jwt-token"),
	};
	const rooms = {
		createRoom: vi.fn(async () => undefined),
		deleteRoom: vi.fn(async () => undefined),
	};
	const dispatch = {
		createDispatch: vi.fn(async () => ({ id: "disp-1" })),
	};
	let service: SpeakingService;

	beforeEach(() => {
		vi.clearAllMocks();
		calls.getCall.mockResolvedValue(call);
		service = new SpeakingService(
			calls as never,
			tokens as never,
			rooms as never,
			dispatch as never,
		);
	});

	it("createCall persists, creates a room, dispatches the agent, and returns a token", async () => {
		const result = await service.createCall({
			userId: "user-1",
			sourceLanguage: "English",
			languageLevel: "B1",
			explanationLanguage: "Spanish",
			topic: "Airport check-in",
		});

		expect(rooms.createRoom).toHaveBeenCalledWith({
			name: call.roomName,
			emptyTimeout: 60,
		});
		expect(dispatch.createDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				roomName: call.roomName,
				agentName: "teacher-agent",
				metadata: expect.stringContaining("Airport check-in"),
			}),
		);
		expect(calls.createCall).toHaveBeenCalledWith({
			userId: "user-1",
			sourceLanguage: "English",
			languageLevel: "B1",
			explanationLanguage: "Spanish",
		});
		expect(result).toEqual({
			callId: call.id,
			roomName: call.roomName,
			token: "jwt-token",
			livekitUrl: "ws://localhost:7880",
		});
	});

	it("createCall marks the call failed and deletes the room when dispatch fails", async () => {
		dispatch.createDispatch.mockRejectedValueOnce(new Error("dispatch down"));

		await expect(
			service.createCall({
				userId: "user-1",
				sourceLanguage: "English",
				languageLevel: "B1",
			}),
		).rejects.toThrow("dispatch down");

		expect(rooms.deleteRoom).toHaveBeenCalledWith(call.roomName);
		expect(calls.markFailed).toHaveBeenCalledWith({
			callId: call.id,
			reason: "dispatch down",
		});
	});

	it("endCall deletes the room and marks the call ended", async () => {
		const result = await service.endCall({
			callId: call.id,
			userId: "user-1",
		});

		expect(rooms.deleteRoom).toHaveBeenCalledWith(call.roomName);
		expect(calls.markEnded).toHaveBeenCalledWith({
			callId: call.id,
			reason: "user_ended",
		});
		expect(result.status).toBe("ended");
	});

	it("listCallsForUser maps owned records to history items", async () => {
		const items = await service.listCallsForUser("user-1");
		expect(calls.listCallsForUser).toHaveBeenCalledWith("user-1");
		expect(items).toEqual([
			expect.objectContaining({
				id: call.id,
				status: "active",
				durationSeconds: null,
			}),
		]);
		expect(items[0]).not.toHaveProperty("topic");
	});

	it("endCall rejects a non-owner", async () => {
		await expect(
			service.endCall({ callId: call.id, userId: "other" }),
		).rejects.toBeInstanceOf(ForbiddenException);
	});

	it("endCall rejects a missing call", async () => {
		calls.getCall.mockResolvedValueOnce(null);
		await expect(
			service.endCall({ callId: call.id, userId: "user-1" }),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it("endCall rejects a call that is not active", async () => {
		calls.getCall.mockResolvedValueOnce(makeCall({ status: "ended" }));
		await expect(
			service.endCall({ callId: call.id, userId: "user-1" }),
		).rejects.toBeInstanceOf(ConflictException);
	});
});
