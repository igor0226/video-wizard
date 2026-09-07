import { startMinioForTests, stopMinioForTests } from "./minio-test-setup";

export default async function globalSetup(): Promise<() => Promise<void>> {
	await startMinioForTests();

	return async () => {
		await stopMinioForTests();
	};
}
