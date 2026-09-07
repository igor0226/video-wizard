import os from "node:os";
import path from "node:path";

export function resolveMediaWorkspaceRoot(): string {
	return (
		process.env.MEDIA_WORKSPACE_ROOT?.trim() ||
		path.join(os.tmpdir(), "video-streaming-workspace")
	);
}
