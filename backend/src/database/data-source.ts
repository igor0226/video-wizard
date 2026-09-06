import path from "node:path";

import { DataSource } from "typeorm";

import { ProcessingHistory, ProcessingLock, Video } from "../models";
import { getPostgresConfig } from "./utils/postgres-config";

export function createAppDataSource(): DataSource {
	return new DataSource({
		type: "postgres",
		...getPostgresConfig(),
		entities: [Video, ProcessingHistory, ProcessingLock],
		migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
		synchronize: false,
	});
}

export default createAppDataSource();
