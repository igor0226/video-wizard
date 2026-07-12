import { readFile } from "node:fs/promises";
import path from "node:path";
import { videoRepository } from "./storage";

function getContentTypeByExtension(filePath: string): string {
	const ext = path.extname(filePath).toLowerCase();
	if (ext === ".mpd") {
		return "application/dash+xml; charset=utf-8";
	}
	if (ext === ".m4s") {
		return "video/iso.segment";
	}
	if (ext === ".mp4") {
		return "video/mp4";
	}
	return "application/octet-stream";
}

export type DashManifest = {
	absolutePath: string;
	fileName: string;
	content: string;
	contentType: string;
};

function assertPathInsideRoot(rootPath: string, maybePath: string): void {
	const normalizedRoot = `${path.normalize(rootPath)}${path.sep}`;
	const normalizedAsset = path.normalize(maybePath);
	if (!normalizedAsset.startsWith(normalizedRoot)) {
		throw new Error("Invalid DASH asset path");
	}
}

function toDashRootAbsolutePath(relativePath: string): string {
	return path.join(process.cwd(), "videos", relativePath);
}

export async function readDashManifest(videoId: string): Promise<DashManifest> {
	const video = await videoRepository.getVideoById(videoId);
	if (!video) {
		throw new Error("Video not found");
	}

	if (video.status !== "ready") {
		throw new Error("Video is not ready for playback");
	}

	const manifestRelativePath = path.posix.join(
		video.dashRelativePath,
		video.manifestFileName,
	);
	const absolutePath = toDashRootAbsolutePath(manifestRelativePath);

	return {
		absolutePath,
		fileName: video.manifestFileName,
		content: await readFile(absolutePath, "utf8"),
		contentType: getContentTypeByExtension(absolutePath),
	};
}

export async function resolveDashAssetPath(
	videoId: string,
	assetPathParts: string[],
): Promise<string> {
	if (assetPathParts.length === 0) {
		throw new Error("Missing DASH asset path");
	}

	const video = await videoRepository.getVideoById(videoId);
	if (!video) {
		throw new Error("Video not found");
	}
	const normalizedParts = assetPathParts
		.map((part) => decodeURIComponent(part))
		.filter(Boolean);
	const rootRelativePath = video.dashRelativePath;
	const rootAbsolutePath = toDashRootAbsolutePath(rootRelativePath);
	const joinedPath = path.join(rootAbsolutePath, ...normalizedParts);
	assertPathInsideRoot(rootAbsolutePath, joinedPath);
	return joinedPath;
}

export function getDashAssetContentType(assetPath: string): string {
	return getContentTypeByExtension(assetPath);
}
