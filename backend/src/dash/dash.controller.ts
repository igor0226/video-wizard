import type { Request, Response } from "express";
import type { DashService } from "./dash.service";
import { createReadStream } from "node:fs";

import {
	Controller,
	Get,
	Header,
	NotFoundException,
	Param,
	Req,
	Res,
	StreamableFile,
} from "@nestjs/common";

@Controller("dash")
export class DashController {
	constructor(private readonly dashService: DashService) {}

	@Get(":videoId/manifest.mpd")
	@Header("Cache-Control", "no-store")
	async getManifest(
		@Param('videoId') videoId: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<string> {
		try {
			const manifest = await this.dashService.readDashManifest(videoId);
			res.setHeader("Content-Type", manifest.contentType);
			return manifest.content;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			const message =
				error instanceof Error ? error.message : "Failed to load DASH manifest";
			throw new NotFoundException(message);
		}
	}

	@Get(":videoId/segment/*path")
	@Header("Cache-Control", "public, max-age=31536000, immutable")
	async getSegment(
		@Param('videoId') videoId: string,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	): Promise<StreamableFile> {
		try {
			const marker = "/segment/";
			const markerIndex = req.path.indexOf(marker);
			const assetPath =
				markerIndex >= 0 ? req.path.slice(markerIndex + marker.length) : "";
			const parts = assetPath
				.split("/")
				.map((part) => decodeURIComponent(part.trim()))
				.filter(Boolean);
			const absoluteAssetPath = await this.dashService.resolveDashAssetPath(
				videoId,
				parts,
			);
			res.setHeader(
				"Content-Type",
				this.dashService.getDashAssetContentType(absoluteAssetPath),
			);
			return new StreamableFile(createReadStream(absoluteAssetPath));
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			const message =
				error instanceof Error ? error.message : "Failed to load DASH segment";
			throw new NotFoundException(message);
		}
	}
}
