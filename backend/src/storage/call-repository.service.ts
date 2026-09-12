import { randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";

import { TeacherCall } from "../models";
import type { CreateTeacherCallInput, TeacherCallRecord } from "./types";
import { isInvalidUuidError } from "./utils/postgres-errors";
import { normalizeTeacherCallRecord } from "./utils/teacher-call-record";

@Injectable()
export class CallRepositoryService {
	constructor(
		@InjectRepository(TeacherCall)
		private readonly callRepository: Repository<TeacherCall>,
	) {}

	async createCall(input: CreateTeacherCallInput): Promise<TeacherCallRecord> {
		const id = randomUUID();
		const nowIso = new Date().toISOString();
		const record: TeacherCallRecord = {
			id,
			userId: input.userId,
			roomName: `teacher-${id}`,
			status: "active",
			sourceLanguage: input.sourceLanguage,
			languageLevel: input.languageLevel,
			explanationLanguage: input.explanationLanguage?.trim() || null,
			agentDispatchId: null,
			endedReason: null,
			createdAt: nowIso,
			endedAt: null,
		};
		await this.callRepository.save(record);
		return record;
	}

	async getCall(callId: string): Promise<TeacherCallRecord | null> {
		try {
			const record = await this.callRepository.findOne({
				where: { id: callId },
			});
			return record ? normalizeTeacherCallRecord(record) : null;
		} catch (error) {
			if (isInvalidUuidError(error)) {
				return null;
			}
			throw error;
		}
	}

	async getCallByRoomName(roomName: string): Promise<TeacherCallRecord | null> {
		const record = await this.callRepository.findOne({ where: { roomName } });
		return record ? normalizeTeacherCallRecord(record) : null;
	}

	async listCallsForUser(userId: string): Promise<TeacherCallRecord[]> {
		const records = await this.callRepository.find({
			where: { userId },
			order: { createdAt: "DESC" },
		});
		return records.map(normalizeTeacherCallRecord);
	}

	async listActiveCallsCreatedBefore(input: {
		createdBefore: string;
	}): Promise<TeacherCallRecord[]> {
		const records = await this.callRepository.find({
			where: {
				status: "active",
				createdAt: LessThan(input.createdBefore),
			},
			order: { createdAt: "ASC" },
		});
		return records.map(normalizeTeacherCallRecord);
	}

	async setAgentDispatchId(input: {
		callId: string;
		agentDispatchId: string;
	}): Promise<TeacherCallRecord> {
		return this.patchCall({
			callId: input.callId,
			patch: { agentDispatchId: input.agentDispatchId },
		});
	}

	async markEnded(input: {
		callId: string;
		reason: string;
	}): Promise<TeacherCallRecord> {
		return this.patchCall({
			callId: input.callId,
			patch: {
				status: "ended",
				endedReason: input.reason,
				endedAt: new Date().toISOString(),
			},
		});
	}

	async markFailed(input: {
		callId: string;
		reason: string;
	}): Promise<TeacherCallRecord> {
		return this.patchCall({
			callId: input.callId,
			patch: {
				status: "failed",
				endedReason: input.reason,
				endedAt: new Date().toISOString(),
			},
		});
	}

	private async patchCall(input: {
		callId: string;
		patch: Partial<TeacherCallRecord>;
	}): Promise<TeacherCallRecord> {
		const existing = await this.getCall(input.callId);
		if (!existing) {
			throw new Error(`Teacher call not found: ${input.callId}`);
		}
		const updated: TeacherCallRecord = {
			...existing,
			...input.patch,
			id: existing.id,
			createdAt: existing.createdAt,
		};
		await this.callRepository.save(updated);
		return updated;
	}
}
