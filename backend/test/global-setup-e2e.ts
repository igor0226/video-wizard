import {
	resetPostgresTables,
	startPostgresForTests,
	stopPostgresForTests,
} from "./postgres-test-setup";

export default async function globalSetup(): Promise<() => Promise<void>> {
	await startPostgresForTests();
	await resetPostgresTables();

	return async () => {
		await stopPostgresForTests();
	};
}
