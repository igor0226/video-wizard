import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { afterAll, beforeAll } from "vitest";

import { BlobStorageService } from "../../../src/storage";
import { createTestApp } from "../../create-test-app";
import { resetPostgresTables } from "../../postgres-test-setup";
import { setupE2eStorage, teardownE2eStorage } from "../../setup-e2e";

let app: INestApplication;
let moduleRef: TestingModule;

export function useE2eApp(): {
	getApp: () => INestApplication;
	getBlobStorage: () => BlobStorageService;
} {
	beforeAll(async () => {
		await setupE2eStorage();
		await resetPostgresTables();
		({ app, moduleRef } = await createTestApp());
	});

	afterAll(async () => {
		await app.close();
		await teardownE2eStorage();
	});

	return {
		getApp: () => app,
		getBlobStorage: () => moduleRef.get(BlobStorageService),
	};
}
