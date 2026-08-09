import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DashService } from "./dash/dash.service";
import { FfmpegAudioService } from "./processing/ffmpeg-audio.service";
import { FfmpegDashService } from "./processing/ffmpeg-dash.service";
import { JobsService } from "./processing/jobs.service";
import { ProcessingWorkerService } from "./processing/processing.service";
import { WhisperTranscriptionService } from "./processing/transcription.service";
import { BlobStorageService, VideoRepositoryService } from "./storage";
import { VideosService } from "./videos/videos.service";
import { createTestApp } from "../test/create-test-app";
import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";

describe("AppModule", () => {
	let app: INestApplication;
	let moduleRef: TestingModule;

	beforeAll(async () => {
		({ app, moduleRef } = await createTestApp());
	});

	afterAll(async () => {
		await app.close();
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
