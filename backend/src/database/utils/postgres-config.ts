export type PostgresConfig = {
	host: string;
	port: number;
	username: string;
	password: string;
	database: string;
};

export function getPostgresConfig(): PostgresConfig {
	return {
		host: process.env.POSTGRES_HOST ?? "localhost",
		port: Number(process.env.POSTGRES_PORT ?? 5432),
		username: process.env.POSTGRES_USER ?? "postgres",
		password: process.env.POSTGRES_PASSWORD ?? "postgres",
		database: process.env.POSTGRES_DB ?? "video_streaming",
	};
}
