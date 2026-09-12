import type { VideoStatusResponse, VideosResponse } from "../model/types";

export function applyVideoStatusToList(input: {
	previous: VideosResponse | undefined;
	videoId: string;
	status: VideoStatusResponse;
}): VideosResponse | undefined {
	if (!input.previous) {
		return input.previous;
	}
	return {
		videos: input.previous.videos.map((video) =>
			video.id === input.videoId
				? {
						...video,
						status: input.status.status,
						playable: input.status.playable,
						chunkCount: input.status.chunkCount,
						failureReason: input.status.failureReason,
						processingStep: input.status.processingStep,
						queuePosition: input.status.queuePosition,
						sourceLanguage: input.status.sourceLanguage,
						explanationLanguage: input.status.explanationLanguage,
						languageLevel: input.status.languageLevel,
					}
				: video,
		),
	};
}
