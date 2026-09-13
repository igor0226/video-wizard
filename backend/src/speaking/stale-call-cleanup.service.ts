import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";

import { CallRepositoryService } from "../storage";
import type { TeacherCallRecord } from "../storage/types";
import { LivekitRoomService } from "./livekit-room.service";
import {
	STALE_CALL_ENDED_REASON,
	staleCallCutoffIso,
} from "./utils/stale-call-config";

@Injectable()
export class StaleCallCleanupService {
	constructor(
		@InjectPinoLogger(StaleCallCleanupService.name)
		private readonly logger: PinoLogger,
		private readonly calls: CallRepositoryService,
		private readonly rooms: LivekitRoomService,
	) {}

	async sweep(): Promise<void> {
		const createdBefore = staleCallCutoffIso();
		const candidates = await this.calls.listActiveCallsCreatedBefore({
			createdBefore,
		});
		for (const call of candidates) {
			await this.reconcileCall(call);
		}
	}

	private async reconcileCall(call: TeacherCallRecord): Promise<void> {
		try {
			if (await this.rooms.roomExists(call.roomName)) {
				return;
			}
			await this.calls.markFailed({
				callId: call.id,
				reason: STALE_CALL_ENDED_REASON,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "reconcile failed";
			this.logger.error({ err: message, callId: call.id }, "stale call skip");
		}
	}
}
