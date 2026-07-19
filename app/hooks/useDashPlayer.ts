"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	type DashManifestModel,
	findSegmentIndexByTime,
	getBufferedSeconds,
	getBufferedUntil,
	parseDashManifest,
} from "../lib/dash";
import type { VideoItem } from "../types/video";

type AppendQueueItem = {
	kind: "init" | "media";
	data: ArrayBuffer;
};

const BUFFER_SEGMENTS_AHEAD = 3;

function isSourceBufferAttached(
	mediaSource: MediaSource,
	sourceBuffer: SourceBuffer,
): boolean {
	return Array.from(mediaSource.sourceBuffers).includes(sourceBuffer);
}

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
	const playbackSessionRef = useRef(0);
	const onUpdateEndRef = useRef<(() => void) | null>(null);
	const onSourceOpenRef = useRef<((event: Event) => void) | null>(null);

	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [totalDuration, setTotalDuration] = useState(0);
	const [bufferedSeconds, setBufferedSeconds] = useState(0);
	const [bufferedUntil, setBufferedUntil] = useState(0);
	const [loadedSegmentCount, setLoadedSegmentCount] = useState(0);
	const [playerError, setPlayerError] = useState<string | null>(null);

	const isSessionActive = useCallback((session: number) => {
		return session === playbackSessionRef.current;
	}, []);

	const releaseMediaResources = useCallback(() => {
		playbackSessionRef.current += 1;
		manifestRef.current = null;
		fetchInFlightRef.current = false;
		appendQueueRef.current = [];

		const sourceBuffer = sourceBufferRef.current;
		const mediaSource = mediaSourceRef.current;
		const videoEl = videoRef.current;

		if (sourceBuffer && onUpdateEndRef.current) {
			try {
				sourceBuffer.removeEventListener("updateend", onUpdateEndRef.current);
			} catch {
				// Ignore detached source buffer errors.
			}
			onUpdateEndRef.current = null;
		}

		if (mediaSource && onSourceOpenRef.current) {
			try {
				mediaSource.removeEventListener("sourceopen", onSourceOpenRef.current);
			} catch {
				// Ignore detached media source errors.
			}
			onSourceOpenRef.current = null;
		}

		if (sourceBuffer?.updating) {
			try {
				sourceBuffer.abort();
			} catch {
				// Ignore abort errors while replacing video stream.
			}
		}

		if (mediaSource && sourceBuffer) {
			try {
				if (isSourceBufferAttached(mediaSource, sourceBuffer)) {
					mediaSource.removeSourceBuffer(sourceBuffer);
				}
			} catch {
				// Ignore detached source buffer errors.
			}
		}

		sourceBufferRef.current = null;
		mediaSourceRef.current = null;

		if (videoEl && streamUrlRef.current) {
			videoEl.removeAttribute("src");
			videoEl.load();
			URL.revokeObjectURL(streamUrlRef.current);
			streamUrlRef.current = null;
		}
	}, []);

	const flushQueue = useCallback(() => {
		const sourceBuffer = sourceBufferRef.current;
		const mediaSource = mediaSourceRef.current;
		if (!sourceBuffer || !mediaSource || sourceBuffer.updating) {
			return;
		}

		if (!isSourceBufferAttached(mediaSource, sourceBuffer)) {
			sourceBufferRef.current = null;
			appendQueueRef.current = [];
			return;
		}

		const next = appendQueueRef.current.shift();
		if (!next) {
			return;
		}

		try {
			sourceBuffer.appendBuffer(next.data);
			if (next.kind === "media") {
				setLoadedSegmentCount((value) => value + 1);
			}
		} catch {
			appendQueueRef.current = [];
		}
	}, []);

	const fetchSegmentBytes = useCallback(
		async (segmentUrl: string): Promise<ArrayBuffer> => {
			const response = await fetch(segmentUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch segment (${response.status})`);
			}
			return response.arrayBuffer();
		},
		[],
	);

	const fetchSegments = useCallback(async () => {
		if (fetchInFlightRef.current) {
			return;
		}

		const session = playbackSessionRef.current;
		const manifest = manifestRef.current;
		if (!manifest) {
			return;
		}

		fetchInFlightRef.current = true;
		try {
			while (
				isSessionActive(session) &&
				nextSegmentToFetchRef.current < manifest.segments.length &&
				nextSegmentToFetchRef.current <= desiredSegmentIndexRef.current
			) {
				const segment = manifest.segments[nextSegmentToFetchRef.current];
				const bytes = await fetchSegmentBytes(segment.url);
				if (!isSessionActive(session)) {
					return;
				}

				appendQueueRef.current.push({ kind: "media", data: bytes });
				flushQueue();
				nextSegmentToFetchRef.current += 1;
			}
		} catch (caughtError) {
			if (!isSessionActive(session)) {
				return;
			}
			const message =
				caughtError instanceof Error
					? caughtError.message
					: "Unable to fetch media segment";
			setPlayerError(message);
		} finally {
			if (isSessionActive(session)) {
				fetchInFlightRef.current = false;
			}
		}
	}, [fetchSegmentBytes, flushQueue, isSessionActive]);

	const extendBufferForTime = useCallback(
		(timeSeconds: number) => {
			const manifest = manifestRef.current;
			if (!manifest) {
				return;
			}

			const currentSegmentIndex = findSegmentIndexByTime(
				manifest.segments,
				timeSeconds,
			);
			const target = Math.min(
				manifest.segments.length - 1,
				currentSegmentIndex + BUFFER_SEGMENTS_AHEAD,
			);
			desiredSegmentIndexRef.current = Math.max(
				desiredSegmentIndexRef.current,
				target,
			);
			void fetchSegments();
		},
		[fetchSegments],
	);

	const initializeMediaSource = useCallback(
		async (videoId: string, startAtSeconds: number) => {
			const videoEl = videoRef.current;
			if (!videoEl) {
				return;
			}

			releaseMediaResources();
			const session = playbackSessionRef.current;

			setCurrentTime(0);
			setTotalDuration(0);
			setLoadedSegmentCount(0);
			setBufferedSeconds(0);
			setBufferedUntil(0);

			if (typeof window === "undefined" || typeof MediaSource === "undefined") {
				setPlayerError(
					"Media Source Extensions are not supported in this browser",
				);
				return;
			}

			const manifestResponse = await fetch(`/api/dash/${videoId}/manifest`);
			if (!isSessionActive(session)) {
				return;
			}
			if (!manifestResponse.ok) {
				throw new Error("Unable to load manifest for selected video");
			}

			const manifestText = await manifestResponse.text();
			if (!isSessionActive(session)) {
				return;
			}

			const manifest = parseDashManifest(manifestText, videoId);
			manifestRef.current = manifest;
			setTotalDuration(manifest.totalDurationSeconds);

			const mediaSource = new MediaSource();
			mediaSourceRef.current = mediaSource;
			const objectUrl = URL.createObjectURL(mediaSource);
			streamUrlRef.current = objectUrl;
			videoEl.src = objectUrl;

			const initialSegmentIndex = findSegmentIndexByTime(
				manifest.segments,
				startAtSeconds,
			);
			nextSegmentToFetchRef.current = initialSegmentIndex;
			desiredSegmentIndexRef.current = Math.min(
				manifest.segments.length - 1,
				initialSegmentIndex + BUFFER_SEGMENTS_AHEAD,
			);

			const onSourceOpen = async () => {
				if (!isSessionActive(session)) {
					return;
				}
				if (mediaSourceRef.current !== mediaSource) {
					return;
				}
				if (mediaSource.readyState !== "open") {
					return;
				}

				const sourceBuffer = mediaSource.addSourceBuffer(
					`${manifest.mimeType}; codecs="${manifest.codecs}"`,
				);
				sourceBuffer.mode = "segments";
				sourceBufferRef.current = sourceBuffer;

				const onUpdateEnd = () => {
					if (!isSessionActive(session)) {
						return;
					}
					flushQueue();
				};
				onUpdateEndRef.current = onUpdateEnd;
				sourceBuffer.addEventListener("updateend", onUpdateEnd);

				const initBytes = await fetchSegmentBytes(manifest.initializationUrl);
				if (!isSessionActive(session)) {
					return;
				}

				appendQueueRef.current.push({ kind: "init", data: initBytes });
				flushQueue();
				void fetchSegments();
			};

			onSourceOpenRef.current = onSourceOpen;
			mediaSource.addEventListener("sourceopen", onSourceOpen);
		},
		[
			fetchSegmentBytes,
			fetchSegments,
			flushQueue,
			isSessionActive,
			releaseMediaResources,
		],
	);

	const videoId = selectedVideo?.id ?? null;
	const isPlayable = Boolean(selectedVideo?.playable);

	useEffect(() => {
		if (!isPlayable || !videoId) {
			releaseMediaResources();
			return;
		}

		let isActive = true;
		setPlayerError(null);

		void initializeMediaSource(videoId, 0).catch((caughtError) => {
			if (!isActive) {
				return;
			}
			const message =
				caughtError instanceof Error
					? caughtError.message
					: "Playback initialization failed";
			setPlayerError(message);
		});

		return () => {
			isActive = false;
			releaseMediaResources();
		};
	}, [videoId, isPlayable, initializeMediaSource, releaseMediaResources]);

	const playerState = useMemo(
		() => ({
			isPlaying,
			currentTime,
			totalDuration,
			bufferedSeconds,
			bufferedUntil,
			loadedSegmentCount,
			playerError,
		}),
		[
			bufferedSeconds,
			bufferedUntil,
			currentTime,
			isPlaying,
			loadedSegmentCount,
			playerError,
			totalDuration,
		],
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
		...playerState,
	};
}
