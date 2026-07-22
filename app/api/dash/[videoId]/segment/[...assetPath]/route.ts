import { readFile } from "node:fs/promises";

import {
	getDashAssetContentType,
	resolveDashAssetPath,
} from "../../../../../../lib/dash";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	context: { params: Promise<{ videoId: string; assetPath: string[] }> },
): Promise<Response> {
	try {
		const { videoId, assetPath } = await context.params;
		const absoluteAssetPath = await resolveDashAssetPath(videoId, assetPath);
		const buffer = await readFile(absoluteAssetPath);
		return new Response(buffer, {
			status: 200,
			headers: {
				"Content-Type": getDashAssetContentType(absoluteAssetPath),
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to load DASH segment";
		return new Response(message, { status: 404 });
	}
}
