"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findSegmentIndexByTime, getBufferedSeconds, getBufferedUntil, parseDashManifest, type DashManifestModel } from "../lib/dash";
import type { VideoItem } from "../types/video";

type AppendQueueItem = {
  kind: "init" | "media";
  data: ArrayBuffer;
};

const BUFFER_SEGMENTS_AHEAD = 3;

export function useDashPlayer(selectedVideo: VideoItem | null) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const streamUrlRef = useRef<string | null>(null);
  const manifestRef = useRef<DashManifestModel | null>(null);
  const appendQueueRef = useRef<AppendQueueItem[]>([]);
  const nextSegmentToFetchRef = useRef(0);
  const desiredSegmentIndexRef = useRef(0);
  const fetchInFlightRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [bufferedSeconds, setBufferedSeconds] = useState(0);
  const [bufferedUntil, setBufferedUntil] = useState(0);
  const [loadedSegmentCount, setLoadedSegmentCount] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const releaseMediaResources = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current;
    const videoEl = videoRef.current;

    if (sourceBuffer?.updating) {
      try {
        sourceBuffer.abort();
      } catch {
        // Ignore abort errors while replacing video stream.
      }
    }

    if (mediaSourceRef.current && sourceBuffer && mediaSourceRef.current.sourceBuffers.length > 0) {
      try {
        mediaSourceRef.current.removeSourceBuffer(sourceBuffer);
      } catch {
        // Ignore detached source buffer errors.
      }
    }

    sourceBufferRef.current = null;
    mediaSourceRef.current = null;
    appendQueueRef.current = [];

    if (videoEl && streamUrlRef.current) {
      videoEl.removeAttribute("src");
      videoEl.load();
      URL.revokeObjectURL(streamUrlRef.current);
      streamUrlRef.current = null;
    }
  }, []);

  const flushQueue = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current;
    if (!sourceBuffer || sourceBuffer.updating) {
      return;
    }
    const next = appendQueueRef.current.shift();
    if (!next) {
      return;
    }
    sourceBuffer.appendBuffer(next.data);
    if (next.kind === "media") {
      setLoadedSegmentCount((value) => value + 1);
    }
  }, []);

  const fetchSegmentBytes = useCallback(async (segmentUrl: string): Promise<ArrayBuffer> => {
    const response = await fetch(segmentUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch segment (${response.status})`);
    }
    return response.arrayBuffer();
  }, []);

  const fetchSegments = useCallback(async () => {
    if (fetchInFlightRef.current) {
      return;
    }

    const manifest = manifestRef.current;
    if (!manifest) {
      return;
    }

    fetchInFlightRef.current = true;
    try {
      while (
        nextSegmentToFetchRef.current < manifest.segments.length &&
        nextSegmentToFetchRef.current <= desiredSegmentIndexRef.current
      ) {
        const segment = manifest.segments[nextSegmentToFetchRef.current];
        const bytes = await fetchSegmentBytes(segment.url);
        appendQueueRef.current.push({ kind: "media", data: bytes });
        flushQueue();
        nextSegmentToFetchRef.current += 1;
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to fetch media segment";
      setPlayerError(message);
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [fetchSegmentBytes, flushQueue]);

  const extendBufferForTime = useCallback(
    (timeSeconds: number) => {
      const manifest = manifestRef.current;
      if (!manifest) {
        return;
      }

      const currentSegmentIndex = findSegmentIndexByTime(manifest.segments, timeSeconds);
      const target = Math.min(manifest.segments.length - 1, currentSegmentIndex + BUFFER_SEGMENTS_AHEAD);
      desiredSegmentIndexRef.current = Math.max(desiredSegmentIndexRef.current, target);
      void fetchSegments();
    },
    [fetchSegments]
  );

  const initializeMediaSource = useCallback(
    async (videoId: string, startAtSeconds: number) => {
      const videoEl = videoRef.current;
      if (!videoEl) {
        return;
      }

      releaseMediaResources();
      setCurrentTime(0);
      setTotalDuration(0);
      setLoadedSegmentCount(0);
      setBufferedSeconds(0);
      setBufferedUntil(0);

      if (typeof window === "undefined" || typeof MediaSource === "undefined") {
        setPlayerError("Media Source Extensions are not supported in this browser");
        return;
      }

      const manifestResponse = await fetch(`/api/dash/${videoId}/manifest`);
      if (!manifestResponse.ok) {
        throw new Error("Unable to load manifest for selected video");
      }

      const manifestText = await manifestResponse.text();
      const manifest = parseDashManifest(manifestText, videoId);
      manifestRef.current = manifest;
      setTotalDuration(manifest.totalDurationSeconds);

      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      const objectUrl = URL.createObjectURL(mediaSource);
      streamUrlRef.current = objectUrl;
      videoEl.src = objectUrl;

      const initialSegmentIndex = findSegmentIndexByTime(manifest.segments, startAtSeconds);
      nextSegmentToFetchRef.current = initialSegmentIndex;
      desiredSegmentIndexRef.current = Math.min(manifest.segments.length - 1, initialSegmentIndex + BUFFER_SEGMENTS_AHEAD);

      mediaSource.addEventListener("sourceopen", async () => {
        if (!mediaSourceRef.current || mediaSourceRef.current.readyState !== "open") {
          return;
        }
        const sourceBuffer = mediaSource.addSourceBuffer(`${manifest.mimeType}; codecs="${manifest.codecs}"`);
        sourceBuffer.mode = "segments";
        sourceBufferRef.current = sourceBuffer;
        sourceBuffer.addEventListener("updateend", () => {
          flushQueue();
        });

        const initBytes = await fetchSegmentBytes(manifest.initializationUrl);
        appendQueueRef.current.push({ kind: "init", data: initBytes });
        flushQueue();
        void fetchSegments();
      });
    },
    [fetchSegmentBytes, fetchSegments, flushQueue, releaseMediaResources]
  );

  useEffect(() => {
    if (!selectedVideo || !selectedVideo.playable) {
      releaseMediaResources();
      return;
    }

    let isActive = true;
    setPlayerError(null);

    void initializeMediaSource(selectedVideo.id, 0).catch((caughtError) => {
      if (!isActive) {
        return;
      }
      const message = caughtError instanceof Error ? caughtError.message : "Playback initialization failed";
      setPlayerError(message);
    });

    return () => {
      isActive = false;
      releaseMediaResources();
    };
  }, [initializeMediaSource, releaseMediaResources, selectedVideo]);

  const playerState = useMemo(
    () => ({
      isPlaying,
      currentTime,
      totalDuration,
      bufferedSeconds,
      bufferedUntil,
      loadedSegmentCount,
      playerError
    }),
    [bufferedSeconds, bufferedUntil, currentTime, isPlaying, loadedSegmentCount, playerError, totalDuration]
  );

  return {
    videoRef,
    extendBufferForTime,
    setIsPlaying,
    setCurrentTime,
    setBufferedSeconds,
    setBufferedUntil,
    getBufferedSeconds,
    getBufferedUntil,
    ...playerState
  };
}
