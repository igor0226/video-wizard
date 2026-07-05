import { open, stat } from "node:fs/promises";
import { getVideoRecordById, resolveSourceVideoPath } from "../../../../lib/videos";

export const runtime = "nodejs";

function parseRange(rangeHeader: string | null, size: number): { start: number; end: number } | null {
  if (!rangeHeader) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    return null;
  }

  const startText = match[1];
  const endText = match[2];

  let start = startText ? Number.parseInt(startText, 10) : 0;
  let end = endText ? Number.parseInt(endText, 10) : size - 1;

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  if (start < 0) {
    start = 0;
  }
  if (end >= size) {
    end = size - 1;
  }
  if (end < start || start >= size) {
    return null;
  }

  return { start, end };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;
  const video = await getVideoRecordById(id);

  if (!video) {
    return new Response("Video not found", { status: 404 });
  }

  const videoPath = resolveSourceVideoPath(video.sourceRelativePath);
  const metadata = await stat(videoPath);
  const range = parseRange(request.headers.get("range"), metadata.size);

  if (!range) {
    const fullHandle = await open(videoPath, "r");
    const buffer = Buffer.alloc(metadata.size);
    await fullHandle.read(buffer, 0, metadata.size, 0);
    await fullHandle.close();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(metadata.size),
        "Accept-Ranges": "bytes"
      }
    });
  }

  const chunkSize = range.end - range.start + 1;
  const handle = await open(videoPath, "r");
  const chunk = Buffer.alloc(chunkSize);
  await handle.read(chunk, 0, chunkSize, range.start);
  await handle.close();

  return new Response(chunk, {
    status: 206,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${range.start}-${range.end}/${metadata.size}`,
      "Accept-Ranges": "bytes"
    }
  });
}
