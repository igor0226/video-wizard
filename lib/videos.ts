import path from "node:path";
import { videoRepository } from "./storage";

export type VideoListItem = {
  id: string;
  title: string;
  status: "pending" | "processing" | "ready" | "failed";
  sizeBytes: number;
  chunkCount: number;
  playable: boolean;
  createdAt: string;
  updatedAt: string;
  failureReason: string | null;
};

export async function listVideosForApi(): Promise<VideoListItem[]> {
  const videos = await videoRepository.listVideos();
  return videos.map((video) => ({
    id: video.id,
    title: video.title,
    status: video.status,
    sizeBytes: video.sizeBytes,
    chunkCount: video.segmentCount,
    playable: video.status === "ready",
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    failureReason: video.failureReason
  }));
}

export async function getVideoRecordById(videoId: string) {
  return videoRepository.getVideoById(videoId);
}

export function resolveSourceVideoPath(relativePath: string): string {
  return path.join(process.cwd(), "videos", relativePath);
}
