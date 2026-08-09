import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import "./setup";

let e2eStorageRoot = "";

export const getE2eStorageRoot = () => e2eStorageRoot;

export async function setupE2eStorage(): Promise<string> {
	e2eStorageRoot = await mkdtemp(
		path.join(os.tmpdir(), "video-streaming-e2e-"),
	);
	process.env.STORAGE_ROOT = e2eStorageRoot;
	return e2eStorageRoot;
}

export async function teardownE2eStorage(): Promise<void> {
	if (!e2eStorageRoot) {
		return;
	}
	await rm(e2eStorageRoot, { recursive: true, force: true });
	e2eStorageRoot = "";
}
