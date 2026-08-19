import { spawn } from "node:child_process";

export function runProcess(command: string, args: string[]): Promise<void> {
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

export function runProcessWithOutput(
	command: string,
	args: string[],
): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (chunk) => {
			stdout += chunk.toString("utf8");
		});

		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString("utf8");
		});

		child.on("error", (error) => {
			reject(error);
		});

		child.on("close", (exitCode) => {
			if (exitCode === 0) {
				resolve(stdout.trim());
				return;
			}
			reject(new Error(stderr || `Process exited with code ${exitCode}`));
		});
	});
}

export function normalizeFfmpegError(error: unknown): Error {
	const message =
		error instanceof Error ? error.message : "Unknown ffmpeg failure";
	if (/ENOENT|not found/i.test(message)) {
		return new Error("FFmpeg is not installed or not available in PATH");
	}
	return new Error(`FFmpeg failed: ${message}`);
}
