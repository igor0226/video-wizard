import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProcessingHistory, ProcessingLock, Video } from "../models";
import { getPostgresConfig } from "./utils/postgres-config";

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: "postgres" as const,
				...getPostgresConfig(),
				entities: [Video, ProcessingHistory, ProcessingLock],
				synchronize: false,
				autoLoadEntities: false,
			}),
		}),
	],
})
export class DatabaseModule {}
