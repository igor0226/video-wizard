import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import "./setup";

let e2eWorkspaceRoot = "";

export const getE2eWorkspaceRoot = () => e2eWorkspaceRoot;

export async function setupE2eStorage(): Promise<string> {
	e2eWorkspaceRoot = await mkdtemp(
		path.join(os.tmpdir(), "video-streaming-e2e-workspace-"),
	);
	process.env.MEDIA_WORKSPACE_ROOT = e2eWorkspaceRoot;
	return e2eWorkspaceRoot;
}

export async function teardownE2eStorage(): Promise<void> {
	if (!e2eWorkspaceRoot) {
		return;
	}
	await rm(e2eWorkspaceRoot, { recursive: true, force: true });
	e2eWorkspaceRoot = "";
}
