import { readFile } from "node:fs/promises";
import path from "node:path";

import { Injectable, NotFoundException } from "@nestjs/common";

import { getStorageRoot, videoRepository } from "../storage";

export type DashManifest = {
	absolutePath: string;
	fileName: string;
	content: string;
	contentType: string;
};

@Injectable()
export class DashService {
	private getContentTypeByExtension(filePath: string): string {
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

	private assertPathInsideRoot(rootPath: string, maybePath: string): void {
		const normalizedRoot = `${path.normalize(rootPath)}${path.sep}`;
		const normalizedAsset = path.normalize(maybePath);
		if (!normalizedAsset.startsWith(normalizedRoot)) {
			throw new Error("Invalid DASH asset path");
		}
	}

	private toDashRootAbsolutePath(relativePath: string): string {
		return path.join(getStorageRoot(), relativePath);
	}

	private rewriteManifestWithSegmentUrls(
		mpdText: string,
		videoId: string,
	): string {
		const baseUrl = `/api/dash/${videoId}/segment/`;
		return mpdText.replace(
			/(<SegmentTemplate\b)/g,
			`<BaseURL>${baseUrl}</BaseURL>$1`,
		);
	}

	async readDashManifest(videoId: string): Promise<DashManifest> {
		const video = await videoRepository.getVideoById(videoId);
		if (!video) {
			throw new NotFoundException("Video not found");
		}

		if (video.status !== "ready") {
			throw new NotFoundException("Video is not ready for playback");
		}

		const manifestRelativePath = path.posix.join(
			video.dashRelativePath,
			video.manifestFileName,
		);
		const absolutePath = this.toDashRootAbsolutePath(manifestRelativePath);
		const rawContent = await readFile(absolutePath, "utf8");

		return {
			absolutePath,
			fileName: video.manifestFileName,
			content: this.rewriteManifestWithSegmentUrls(rawContent, videoId),
			contentType: this.getContentTypeByExtension(absolutePath),
		};
	}

	async resolveDashAssetPath(
		videoId: string,
		assetPathParts: string[],
	): Promise<string> {
		if (assetPathParts.length === 0) {
			throw new NotFoundException("Missing DASH asset path");
		}

		const video = await videoRepository.getVideoById(videoId);
		if (!video) {
			throw new NotFoundException("Video not found");
		}
		const normalizedParts = assetPathParts
			.map((part) => decodeURIComponent(part))
			.filter(Boolean);
		const rootRelativePath = video.dashRelativePath;
		const rootAbsolutePath = this.toDashRootAbsolutePath(rootRelativePath);
		const joinedPath = path.join(rootAbsolutePath, ...normalizedParts);
		this.assertPathInsideRoot(rootAbsolutePath, joinedPath);
		return joinedPath;
	}

	getDashAssetContentType(assetPath: string): string {
		return this.getContentTypeByExtension(assetPath);
	}
}
