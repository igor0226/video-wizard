import type { INestApplication } from "@nestjs/common";
import { afterAll, beforeAll } from "vitest";

import { createTestApp } from "../../create-test-app";
import { setupE2eStorage, teardownE2eStorage } from "../../setup-e2e";

let app: INestApplication;

export function useE2eApp(): { getApp: () => INestApplication } {
	beforeAll(async () => {
		await setupE2eStorage();
		({ app } = await createTestApp());
	});

	afterAll(async () => {
		await app.close();
		await teardownE2eStorage();
	});

	return {
		getApp: () => app,
	};
}
