import type { VideoRecord } from "../storage";
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { blobStorage, getStoragePathsForVideo } from "../storage";

function runProcess(command: string, args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
		let stderr = "";

		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString("utf8");
		});

		child.on("error", (error) => {
			reject(error);
		});

		child.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve();
				return;
			}
			reject(new Error(stderr || `Process exited with code ${exitCode}`));
		});
	});
}

export async function generateDashAssets(
	video: VideoRecord,
): Promise<{ segmentCount: number }> {
	await blobStorage.ensureLayout();
	const { sourceAbsolutePath, dashAbsolutePath, manifestAbsolutePath } =
		getStoragePathsForVideo(video);
	await blobStorage.ensureCleanDirectory(video.dashRelativePath);

	const args = [
		"-y",
		"-i",
		sourceAbsolutePath,
		"-map",
		"0:v:0",
		"-map",
		"0:a:0?",
		"-c:v",
		"libx264",
		"-preset",
		"veryfast",
		"-crf",
		"23",
		"-c:a",
		"aac",
		"-b:a",
		"128k",
		"-use_timeline",
		"1",
		"-use_template",
		"1",
		"-seg_duration",
		"4",
		"-adaptation_sets",
		"id=0,streams=v id=1,streams=a",
		"-init_seg_name",
		"init-$RepresentationID$.m4s",
		"-media_seg_name",
		"chunk-$RepresentationID$-$Number%05d$.m4s",
		"-f",
		"dash",
		manifestAbsolutePath,
	];

	try {
		// biome-ignore lint: noConsole
		console.info(
			`[video-worker] stage=ffmpeg-run videoId=${video.id} output="${manifestAbsolutePath}"`,
		);
		await runProcess("ffmpeg", args);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown ffmpeg failure";
		if (/ENOENT|not found/i.test(message)) {
			throw new Error("FFmpeg is not installed or not available in PATH");
		}
		throw new Error(`FFmpeg failed: ${message}`);
	}

	const files = await readdir(dashAbsolutePath, { withFileTypes: true });
	const segmentCount = files.filter(
		(entry) =>
			entry.isFile() && path.extname(entry.name).toLowerCase() === ".m4s",
	).length;
	return { segmentCount };
}
