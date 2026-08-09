import { Module, RequestMethod } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

import { DashModule } from "./dash/dash.module";
import { ProcessingModule } from "./processing/processing.module";
import { StorageModule } from "./storage";
import { VideosModule } from "./videos/videos.module";

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: {
				level:
					process.env.LOG_LEVEL ??
					(process.env.NODE_ENV === "production" ? "info" : "debug"),
				transport:
					process.env.NODE_ENV !== "production"
						? { target: "pino-pretty", options: { singleLine: true } }
						: undefined,
			},
			exclude: [
				{ method: RequestMethod.ALL, path: "dash/:videoId/segment/*path" },
			],
		}),
		StorageModule,
		VideosModule,
		DashModule,
		ProcessingModule,
	],
})
export class AppModule {}
