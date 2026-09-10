import { beforeEach, describe, expect, it, vi } from "vitest";

import { LivekitWebhookService } from "./livekit-webhook.service";
import type { TeacherCallRecord } from "../storage/types";
import { LivekitWebhookEventType } from "./utils/livekit-webhook-event";

vi.mock("livekit-server-sdk", () => ({
	WebhookReceiver: class {
		async receive(body: string) {
			return JSON.parse(body) as unknown;
		}
	},
}));

function makeCall(): TeacherCallRecord {
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
	};
}

describe("LivekitWebhookService", () => {
	const calls = {
		getCallByRoomName: vi.fn(async () => makeCall()),
		markEnded: vi.fn(async () => makeCall()),
	};
	const rooms = {
		deleteRoom: vi.fn(async () => undefined),
	};
	let service: LivekitWebhookService;

	beforeEach(() => {
		vi.clearAllMocks();
		calls.getCallByRoomName.mockResolvedValue(makeCall());
		service = new LivekitWebhookService(calls as never, rooms as never);
	});

	it("marks the call ended on room_finished", async () => {
		await service.handleWebhook({
			body: JSON.stringify({
				event: LivekitWebhookEventType.RoomFinished,
				room: { name: "teacher-call-1" },
			}),
			authorization: "Bearer test",
		});
		expect(calls.markEnded).toHaveBeenCalledWith({
			callId: "call-1",
			reason: LivekitWebhookEventType.RoomFinished,
		});
	});

	it("ends the call when the owning participant leaves", async () => {
		await service.handleWebhook({
			body: JSON.stringify({
				event: LivekitWebhookEventType.ParticipantLeft,
				room: { name: "teacher-call-1" },
				participant: { identity: "user-1" },
			}),
			authorization: "Bearer test",
		});
		expect(rooms.deleteRoom).toHaveBeenCalledWith("teacher-call-1");
		expect(calls.markEnded).toHaveBeenCalledWith({
			callId: "call-1",
			reason: LivekitWebhookEventType.ParticipantLeft,
		});
	});

	it("ignores agent participant_left events", async () => {
		await service.handleWebhook({
			body: JSON.stringify({
				event: LivekitWebhookEventType.ParticipantLeft,
				room: { name: "teacher-call-1" },
				participant: { identity: "agent-teacher" },
			}),
			authorization: "Bearer test",
		});
		expect(rooms.deleteRoom).not.toHaveBeenCalled();
		expect(calls.markEnded).not.toHaveBeenCalled();
	});
});
