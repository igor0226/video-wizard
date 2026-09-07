import path from "node:path";

export function normalizeObjectKey(relativePath: string): string {
	const normalized = path.posix.normalize(relativePath.replace(/\\/g, "/"));
	if (
		normalized.startsWith("../") ||
		normalized.includes("/../") ||
		normalized === ".."
	) {
		throw new Error("Invalid storage path");
	}
	return normalized.replace(/^\.\//, "");
}
