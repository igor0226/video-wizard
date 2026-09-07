import type { StartedTestContainer } from "testcontainers";
import { GenericContainer, Wait } from "testcontainers";

import { createS3Client } from "../src/storage/s3-client.provider";
import { resolveS3Config } from "../src/storage/utils/resolve-s3-config";

let container: StartedTestContainer | null = null;
let started = false;

const MINIO_USER = "minioadmin";
const MINIO_PASSWORD = "minioadmin";
const MINIO_BUCKET = "video-streaming-test";

export async function startMinioForTests(): Promise<void> {
	if (started) {
		return;
	}

	container = await new GenericContainer("minio/minio:latest")
		.withExposedPorts(9000)
		.withEnvironment({
			MINIO_ROOT_USER: MINIO_USER,
			MINIO_ROOT_PASSWORD: MINIO_PASSWORD,
		})
		.withCommand(["server", "/data"])
		.withWaitStrategy(
			Wait.forHttp("/minio/health/ready", 9000).forStatusCode(200),
		)
		.start();

	const endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`;
	process.env.S3_ENDPOINT = endpoint;
	process.env.S3_REGION = "us-east-1";
	process.env.S3_BUCKET = MINIO_BUCKET;
	process.env.S3_ACCESS_KEY_ID = MINIO_USER;
	process.env.S3_SECRET_ACCESS_KEY = MINIO_PASSWORD;
	process.env.S3_FORCE_PATH_STYLE = "true";

	const s3Client = createS3Client();
	const { CreateBucketCommand } = await import("@aws-sdk/client-s3");
	await s3Client.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));

	started = true;
}

export async function stopMinioForTests(): Promise<void> {
	if (container) {
		await container.stop();
		container = null;
	}
	started = false;
}

export function getTestS3Bucket(): string {
	return resolveS3Config().bucket;
}
