import { Module } from "@nestjs/common";

import { DashModule } from "./dash/dash.module";
import { ProcessingModule } from "./processing/processing.module";
import { StorageModule } from "./storage";
import { VideosModule } from "./videos/videos.module";

@Module({
	imports: [StorageModule, VideosModule, DashModule, ProcessingModule],
})
export class AppModule {}
