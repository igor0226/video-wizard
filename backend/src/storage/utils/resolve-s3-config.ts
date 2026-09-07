export type S3Config = {
	endpoint: string | undefined;
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	forcePathStyle: boolean;
};

function parseBoolean(
	value: string | undefined,
	defaultValue: boolean,
): boolean {
	if (value === undefined || value.trim() === "") {
		return defaultValue;
	}
	return value.toLowerCase() === "true";
}

export function resolveS3Config(): S3Config {
	const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
	return {
		endpoint,
		region: process.env.S3_REGION?.trim() || "us-east-1",
		bucket: process.env.S3_BUCKET?.trim() || "video-streaming",
		accessKeyId: process.env.S3_ACCESS_KEY_ID?.trim() || "minioadmin",
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY?.trim() || "minioadmin",
		forcePathStyle: parseBoolean(
			process.env.S3_FORCE_PATH_STYLE,
			Boolean(endpoint),
		),
	};
}
