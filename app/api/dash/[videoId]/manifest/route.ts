import { readDashManifest } from "../../../../../lib/dash";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ videoId: string }> }
): Promise<Response> {
  try {
    const { videoId } = await context.params;
    const manifest = await readDashManifest(videoId);
    return new Response(manifest.content, {
      status: 200,
      headers: {
        "Content-Type": manifest.contentType,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load DASH manifest";
    return new Response(message, { status: 404 });
  }
}
