import { generateDashAssets } from "./ffmpeg-dash";
import { blobStorage, videoRepository } from "../storage";
import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";

function normalizeFailureMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 400);
  }
  return "Unexpected processing error";
}

export async function processNextPendingVideo(): Promise<void> {
  console.info("[video-worker] stage=scan-processable start");
  const videos = await videoRepository.listVideos();

  const pending = videos
    .filter((video) => video.status === "pending")
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const staleProcessing = videos
    .filter((video) => video.status === "processing")
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));

  const video = pending[0] ?? staleProcessing[0] ?? null;
  if (!video) {
    console.info("[video-worker] stage=scan-processable result=none");
    return;
  }
  console.info(
    `[video-worker] stage=scan-processable result=found videoId=${video.id} status=${video.status} title="${video.title}"`
  );

  const lockPath = blobStorage.resolveRelativePath(path.posix.join("locks", `${video.id}.lock`));
  await mkdir(path.dirname(lockPath), { recursive: true });

  let lockHandle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    lockHandle = await open(lockPath, "wx");
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "EEXIST") {
      console.info(`[video-worker] stage=lock-skip videoId=${video.id} reason=already-locked`);
      return;
    }
    throw error;
  }

  if (video.status !== "processing") {
    console.info(`[video-worker] stage=mark-processing videoId=${video.id}`);
    await videoRepository.updateVideo(video.id, { status: "processing", failureReason: null });
  } else {
    console.info(`[video-worker] stage=resume-processing videoId=${video.id}`);
  }

  try {
    console.info(`[video-worker] stage=transcode-start videoId=${video.id}`);
    const result = await generateDashAssets(video);
    console.info(`[video-worker] stage=transcode-success videoId=${video.id} segments=${result.segmentCount}`);

    console.info(`[video-worker] stage=mark-ready videoId=${video.id}`);
    await videoRepository.updateVideo(video.id, {
      status: "ready",
      segmentCount: result.segmentCount,
      failureReason: null
    });
    console.info(`[video-worker] stage=done videoId=${video.id} status=ready`);
  } catch (error) {
    const failureReason = normalizeFailureMessage(error);
    console.error(`[video-worker] stage=transcode-failed videoId=${video.id} reason="${failureReason}"`);
    await videoRepository.updateVideo(video.id, {
      status: "failed",
      failureReason
    });
    console.info(`[video-worker] stage=done videoId=${video.id} status=failed`);
  } finally {
    if (lockHandle) {
      await lockHandle.close();
    }
    await rm(lockPath, { force: true });
  }
}
