import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DashService } from "./dash/dash.service";
import { FfmpegAudioService } from "./processing/audio-extract/ffmpeg-audio.service";
import { FfmpegDashService } from "./processing/dash-encoding/ffmpeg-dash.service";
import { JobsService } from "./processing/jobs.service";
import { ProcessingWorkerService } from "./processing/processing.service";
import { WhisperTranscriptionService } from "./processing/transcribing/transcription.service";
import { BlobStorageService, VideoRepositoryService } from "./storage";
import { VideosService } from "./videos/videos.service";
import { createTestApp } from "../test/create-test-app";
import {
	resetPostgresTables,
	startPostgresForTests,
	stopPostgresForTests,
} from "../test/postgres-test-setup";
import { setupE2eStorage, teardownE2eStorage } from "../test/setup-e2e";
import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";

describe("AppModule", () => {
	let app: INestApplication;
	let moduleRef: TestingModule;

	beforeAll(async () => {
		await startPostgresForTests();
		await setupE2eStorage();
		await resetPostgresTables();
		({ app, moduleRef } = await createTestApp());
	}, 120_000);

	afterAll(async () => {
		if (app) {
			await app.close();
		}
		await teardownE2eStorage();
		await stopPostgresForTests();
	});

	it("resolves core providers from the DI container", () => {
		expect(moduleRef.get(VideosService)).toBeDefined();
		expect(moduleRef.get(DashService)).toBeDefined();
		expect(moduleRef.get(JobsService)).toBeDefined();
		expect(moduleRef.get(FfmpegDashService)).toBeDefined();
		expect(moduleRef.get(FfmpegAudioService)).toBeDefined();
		expect(moduleRef.get(WhisperTranscriptionService)).toBeDefined();
		expect(moduleRef.get(BlobStorageService)).toBeDefined();
		expect(moduleRef.get(VideoRepositoryService)).toBeDefined();
		expect(moduleRef.get(ProcessingWorkerService)).toBeDefined();
	});
});
