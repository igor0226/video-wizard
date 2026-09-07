import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ProcessingLock } from "../models";
import { isUniqueViolation } from "./utils/postgres-errors";

@Injectable()
export class ProcessingLockService {
	constructor(
		@InjectRepository(ProcessingLock)
		private readonly lockRepository: Repository<ProcessingLock>,
	) {}

	async tryAcquire(videoId: string): Promise<boolean> {
		try {
			await this.lockRepository.insert({
				videoId,
				acquiredAt: new Date().toISOString(),
			});
			return true;
		} catch (error) {
			if (isUniqueViolation(error)) {
				return false;
			}
			throw error;
		}
	}

	async release(videoId: string): Promise<void> {
		await this.lockRepository.delete({ videoId });
	}
}
