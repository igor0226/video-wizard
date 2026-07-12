import type { RefObject } from "react";
import { Button } from "../../components/ui/button";
import { Slider } from "../../components/ui/slider";
import { formatTime } from "../lib/format";
import type { VideoItem } from "../types/video";

type PlayerPanelProps = {
	selectedVideo: VideoItem | null;
	videoRef: RefObject<HTMLVideoElement | null>;
	isPlaying: boolean;
	currentTime: number;
	totalDuration: number;
	bufferedUntil: number;
	canSeek: boolean;
	onPlay: () => void;
	onPause: () => void;
	onTogglePlay: () => void;
	onSeek: (seconds: number) => void;
	onTimeUpdate: (videoEl: HTMLVideoElement) => void;
	onProgress: (videoEl: HTMLVideoElement) => void;
};

export function PlayerPanel({
	selectedVideo,
	videoRef,
	isPlaying,
	currentTime,
	totalDuration,
	bufferedUntil,
	canSeek,
	onPlay,
	onPause,
	onTogglePlay,
	onSeek,
	onTimeUpdate,
	onProgress,
}: PlayerPanelProps) {
	const clampedCurrentTime = Math.max(
		0,
		Math.min(currentTime, totalDuration || 0),
	);

	return (
		<section className="playerPanel">
			{selectedVideo ? (
				/* biome-ignore lint/a11y/useMediaCaption: handles further in the code */
				<video
					ref={videoRef}
					className="videoElement"
					controls={false}
					onPlay={onPlay}
					onPause={onPause}
					onTimeUpdate={(event) => onTimeUpdate(event.currentTarget)}
					onProgress={(event) => onProgress(event.currentTarget)}
				/>
			) : (
				<div className="videoPlaceholder">
					<p>Select a video from the sidebar or upload a new one.</p>
				</div>
			)}
			{selectedVideo && selectedVideo.status !== "ready" ? (
				<p className="note">
					Status: {selectedVideo.status}
					{selectedVideo.failureReason
						? ` - ${selectedVideo.failureReason}`
						: ""}
				</p>
			) : null}
			<div className="flex items-center gap-2 mt-4">
				<Button
					type="button"
					className="playPauseButton"
					onClick={onTogglePlay}
					disabled={!selectedVideo?.playable}
				>
					{isPlaying ? (
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<rect x="7" y="5" width="4" height="14" rx="1" />
							<rect x="13" y="5" width="4" height="14" rx="1" />
						</svg>
					) : (
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M8 5.5v13l10-6.5-10-6.5z" />
						</svg>
					)}
				</Button>
				<div className="flex-1 customTimeline">
					<Slider
						min={0}
						max={totalDuration || 1}
						step={0.1}
						value={[clampedCurrentTime]}
						bufferedValue={bufferedUntil}
						disabled={!canSeek || totalDuration <= 0}
						onValueChange={(values) => onSeek(values[0] ?? 0)}
						aria-label="Custom video timeline"
						className="timelineSlider"
					/>
					<span className="timelineLabel">
						{formatTime(clampedCurrentTime)} / {formatTime(totalDuration)}
					</span>
				</div>
			</div>
		</section>
	);
}
