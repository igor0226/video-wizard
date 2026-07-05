export type VideoStatus = "pending" | "processing" | "ready" | "failed";

export type VideoItem = {
  id: string;
  title: string;
  status: VideoStatus;
  sizeBytes: number;
  chunkCount: number;
  playable: boolean;
  createdAt: string;
  updatedAt: string;
  failureReason: string | null;
  dashManifestUrl: string | null;
};

export type VideosResponse = {
  videos: VideoItem[];
};

export type VideoStatusResponse = {
  id: string;
  status: VideoStatus;
  failureReason: string | null;
  playable: boolean;
  chunkCount: number;
};
