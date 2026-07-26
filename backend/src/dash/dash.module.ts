import { Module } from "@nestjs/common";

import { DashController } from "./dash.controller";
import { DashService } from "./dash.service";

@Module({
	controllers: [DashController],
	providers: [DashService],
})
export class DashModule {}
