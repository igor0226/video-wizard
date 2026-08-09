import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";

import { AppModule } from "../src/app.module";

export async function createTestApp(): Promise<{
	app: INestApplication;
	moduleRef: TestingModule;
}> {
	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	const app = moduleRef.createNestApplication();
	app.setGlobalPrefix("api");
	await app.init();

	return { app, moduleRef };
}
