import { S3Client } from "@aws-sdk/client-s3";

import { resolveS3Config } from "./utils/resolve-s3-config";

export const S3_CLIENT = Symbol("S3_CLIENT");
export const S3_CONFIG = Symbol("S3_CONFIG");

export function createS3Client(): S3Client {
	const config = resolveS3Config();
	return new S3Client({
		region: config.region,
		endpoint: config.endpoint,
		forcePathStyle: config.forcePathStyle,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
		requestChecksumCalculation: "WHEN_REQUIRED",
		responseChecksumValidation: "WHEN_REQUIRED",
	});
}

export function createS3ConfigProvider() {
	return resolveS3Config();
}
