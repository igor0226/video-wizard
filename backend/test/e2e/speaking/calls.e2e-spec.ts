import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { AgentDispatchService } from "../../../src/speaking/agent-dispatch.service";
import { LivekitRoomService } from "../../../src/speaking/livekit-room.service";
import { LivekitWebhookService } from "../../../src/speaking/livekit-webhook.service";
import { createTestApp } from "../../create-test-app";
import { resetPostgresTables } from "../../postgres-test-setup";
import { setupE2eStorage, teardownE2eStorage } from "../../setup-e2e";
import type { INestApplication } from "@nestjs/common";

describe("Speaking calls (e2e)", () => {
	let app: INestApplication;
	const rooms = {
		createRoom: vi.fn(async () => undefined),
		deleteRoom: vi.fn(async () => undefined),
		removeParticipant: vi.fn(async () => undefined),
	};
	const dispatch = {
		createDispatch: vi.fn(async () => ({ id: "disp-1" })),
	};

	beforeAll(async () => {
		await setupE2eStorage();
		await resetPostgresTables();
		({ app } = await createTestApp({
			override: (builder) =>
				builder
					.overrideProvider(LivekitRoomService)
					.useValue(rooms)
					.overrideProvider(AgentDispatchService)
					.useValue(dispatch)
					.overrideProvider(LivekitWebhookService)
					.useValue({
						handleWebhook: vi.fn(async () => ({ ok: true })),
					}),
		}));
	});

	afterAll(async () => {
		await app.close();
		await teardownE2eStorage();
	});

	it("POST /api/speaking/calls returns 400 without userId", async () => {
		const response = await request(app.getHttpServer())
			.post("/api/speaking/calls")
			.send({ sourceLanguage: "English", languageLevel: "B1" });
		expect(response.status).toBe(400);
	});

	it("GET /api/speaking/calls returns 400 without userId", async () => {
		const response = await request(app.getHttpServer()).get(
			"/api/speaking/calls",
		);
		expect(response.status).toBe(400);
	});

	it("lists history without topic or fluency and newest first", async () => {
		const first = await request(app.getHttpServer())
			.post("/api/speaking/calls")
			.send({
				userId: "history-user",
				sourceLanguage: "English",
				languageLevel: "A2",
				topic: "Airport check-in. Practice booking changes.",
			});
		const second = await request(app.getHttpServer())
			.post("/api/speaking/calls")
			.send({
				userId: "history-user",
				sourceLanguage: "English",
				languageLevel: "B1",
			});
		expect(first.status).toBe(201);
		expect(second.status).toBe(201);

		const listed = await request(app.getHttpServer()).get(
			"/api/speaking/calls?userId=history-user",
		);
		expect(listed.status).toBe(200);
		expect(listed.body).toHaveLength(2);
		expect(listed.body[0].id).toBe(second.body.callId);
		expect(listed.body[1].id).toBe(first.body.callId);
		expect(listed.body[0]).toMatchObject({
			status: "active",
			languageLevel: "B1",
			durationSeconds: null,
		});
		expect(listed.body[0]).not.toHaveProperty("topic");
		expect(listed.body[0]).not.toHaveProperty("fluencyScore");
		expect(listed.body[0]).not.toHaveProperty("roomName");

		const empty = await request(app.getHttpServer()).get(
			"/api/speaking/calls?userId=other-history-user",
		);
		expect(empty.status).toBe(200);
		expect(empty.body).toEqual([]);

		const fetched = await request(app.getHttpServer()).get(
			`/api/speaking/calls/${first.body.callId}?userId=history-user`,
		);
		expect(fetched.body).not.toHaveProperty("topic");
	});

	it("creates, fetches, and ends a teacher call", async () => {
		const created = await request(app.getHttpServer())
			.post("/api/speaking/calls")
			.send({
				userId: "user-1",
				sourceLanguage: "English",
				languageLevel: "b1",
				explanationLanguage: "Spanish",
			});

		expect(created.status).toBe(201);
		expect(created.body).toMatchObject({
			roomName: expect.stringMatching(/^teacher-/),
			livekitUrl: "ws://localhost:7880",
		});
		expect(created.body.token).toEqual(expect.any(String));
		expect(rooms.createRoom).toHaveBeenCalled();
		expect(dispatch.createDispatch).toHaveBeenCalled();

		const callId = created.body.callId as string;
		const fetched = await request(app.getHttpServer()).get(
			`/api/speaking/calls/${callId}?userId=user-1`,
		);
		expect(fetched.status).toBe(200);
		expect(fetched.body).toMatchObject({
			id: callId,
			userId: "user-1",
			status: "active",
			languageLevel: "B1",
		});

		const forbidden = await request(app.getHttpServer()).get(
			`/api/speaking/calls/${callId}?userId=other-user`,
		);
		expect(forbidden.status).toBe(403);

		const ended = await request(app.getHttpServer())
			.post(`/api/speaking/calls/${callId}/end`)
			.send({ userId: "user-1" });
		expect(ended.status).toBe(200);
		expect(ended.body).toEqual({ id: callId, status: "ended" });
		expect(rooms.deleteRoom).toHaveBeenCalled();

		const alreadyEnded = await request(app.getHttpServer())
			.post(`/api/speaking/calls/${callId}/end`)
			.send({ userId: "user-1" });
		expect(alreadyEnded.status).toBe(409);
	});

	it("GET /api/speaking/calls/:id returns 404 for an unknown call", async () => {
		const response = await request(app.getHttpServer()).get(
			"/api/speaking/calls/00000000-0000-4000-8000-000000000000?userId=user-1",
		);
		expect(response.status).toBe(404);
	});
});
