import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
		rawBody: true,
	});
	app.useLogger(app.get(Logger));

	const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
	app.enableCors({
		origin: corsOrigin,
		credentials: true,
	});

	app.setGlobalPrefix("api");

	const port = Number(process.env.PORT ?? 3001);
	await app.listen(port);
	app.get(Logger).log(`listening on http://localhost:${port}`);
}

void bootstrap();
