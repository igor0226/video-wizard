import type { VideoItem } from "../../types/video";

import {
	isDASHProvider,
	MediaPlayer,
	MediaProvider,
	type MediaProviderAdapter,
	type MediaProviderChangeEvent,
} from "@vidstack/react";
import {
	DefaultVideoLayout,
	defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "./PlayerPanel.css";

type PlayerPanelProps = {
	selectedVideo: VideoItem | null;
};

function onProviderChange(
	provider: MediaProviderAdapter | null,
	_nativeEvent: MediaProviderChangeEvent,
) {
	if (isDASHProvider(provider)) {
		provider.library = () => import("dashjs");
	}
}

export function PlayerPanel({ selectedVideo }: PlayerPanelProps) {
	return (
		<section className="playerPanel">
			{selectedVideo?.playable ? (
				<MediaPlayer
					onProviderChange={onProviderChange}
					src={`/api/dash/${selectedVideo.id}/manifest.mpd`}
				>
					<MediaProvider />
					<DefaultVideoLayout icons={defaultLayoutIcons} />
				</MediaPlayer>
			) : (
				<div className="videoPlaceholder">
					<p>
						{selectedVideo
							? "Video is still processing. Playback will be available when ready."
							: "Select a video from the sidebar or upload a new one."}
					</p>
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
		</section>
	);
}
