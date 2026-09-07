import path from "node:path";

export function resolveStorageRoot(): string {
	return process.env.STORAGE_ROOT ?? path.join(process.cwd(), "..", "videos");
}
