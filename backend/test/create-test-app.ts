import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { Test, type TestingModuleBuilder } from "@nestjs/testing";

import { AppModule } from "../src/app.module";

export async function createTestApp(options?: {
	override?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
}): Promise<{
	app: INestApplication;
	moduleRef: TestingModule;
}> {
	let builder = Test.createTestingModule({
		imports: [AppModule],
	});
	if (options?.override) {
		builder = options.override(builder);
	}
	const moduleRef = await builder.compile();
	const app = moduleRef.createNestApplication({ rawBody: true });
	app.setGlobalPrefix("api");
	await app.init();

	return { app, moduleRef };
}
