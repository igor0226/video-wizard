import {
	resetPostgresTables,
	startPostgresForTests,
	stopPostgresForTests,
} from "./postgres-test-setup";
import { startMinioForTests, stopMinioForTests } from "./minio-test-setup";

export default async function globalSetup(): Promise<() => Promise<void>> {
	await startPostgresForTests();
	await startMinioForTests();
	await resetPostgresTables();

	return async () => {
		await stopMinioForTests();
		await stopPostgresForTests();
	};
}
