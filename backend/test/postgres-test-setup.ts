import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { DataSource } from "typeorm";

let container: StartedPostgreSqlContainer | null = null;
let started = false;

async function getDataSource(): Promise<DataSource> {
	const { createAppDataSource } = await import(
		"../src/database/data-source.js"
	);
	return createAppDataSource();
}

export async function startPostgresForTests(): Promise<void> {
	if (started) {
		return;
	}

	container = await new PostgreSqlContainer("postgres:17").start();
	process.env.POSTGRES_HOST = container.getHost();
	process.env.POSTGRES_PORT = String(container.getFirstMappedPort());
	process.env.POSTGRES_USER = container.getUsername();
	process.env.POSTGRES_PASSWORD = container.getPassword();
	process.env.POSTGRES_DB = container.getDatabase();

	const dataSource = await getDataSource();
	await dataSource.initialize();
	await dataSource.runMigrations();
	await dataSource.destroy();

	started = true;
}

export async function stopPostgresForTests(): Promise<void> {
	if (container) {
		await container.stop();
		container = null;
	}
	started = false;
}

export async function resetPostgresTables(): Promise<void> {
	const dataSource = await getDataSource();
	await dataSource.initialize();
	await dataSource.query(
		'TRUNCATE TABLE "processing_locks", "processing_history", "videos", "teacher_calls" RESTART IDENTITY CASCADE',
	);
	await dataSource.destroy();
}
