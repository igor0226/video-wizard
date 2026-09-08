"use client";

import type { VideoItem } from "@/entities/video";

import {
	isDASHProvider,
	MediaPlayer,
	MediaProvider,
	type MediaProviderAdapter,
	type MediaProviderChangeEvent,
	Track,
} from "@vidstack/react";
import {
	DefaultVideoLayout,
	defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import * as DASH from "dashjs";

import { usePlaybackPhrases } from "@/entities/video";
import { apiUrl } from "@/shared/api";
import { PhraseTimeSlider } from "./PhraseTimeSlider";
import "./PlayerPanel.css";

type PlayerPanelProps = {
	selectedVideo: VideoItem | null;
};

function onProviderChange(
	provider: MediaProviderAdapter | null,
	_nativeEvent: MediaProviderChangeEvent,
) {
	if (isDASHProvider(provider)) {
		provider.library = DASH;
	}
}

export function PlayerPanel({ selectedVideo }: PlayerPanelProps) {
	const { phrases } = usePlaybackPhrases(
		selectedVideo?.id,
		selectedVideo?.playable,
	);

	return (
		<section className="playerPanel">
			{selectedVideo?.playable ? (
				<MediaPlayer
					key={selectedVideo.id}
					onProviderChange={onProviderChange}
					src={apiUrl(`/api/dash/${selectedVideo.id}/manifest.mpd`)}
				>
					<MediaProvider />
					{phrases.length > 0 ? (
						<Track
							kind="chapters"
							default
							type="json"
							content={{
								cues: phrases.map((phrase) => ({
									startTime: phrase.startSeconds,
									endTime: phrase.endSeconds,
									text: phrase.phrase,
								})),
							}}
						/>
					) : null}
					<DefaultVideoLayout
						icons={defaultLayoutIcons}
						slots={{ timeSlider: <PhraseTimeSlider /> }}
					/>
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
		</section>
	);
}
