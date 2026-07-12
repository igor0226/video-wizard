import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { formatBytes } from "../lib/format";
import type { VideoItem } from "../types/video";

type MetadataPanelProps = {
	selectedVideo: VideoItem | null;
	bufferedSeconds: number;
	totalDuration: number;
	loadedSegmentCount: number;
};

export function MetadataPanel({
	selectedVideo,
	bufferedSeconds,
	totalDuration,
	loadedSegmentCount,
}: MetadataPanelProps) {
	const estimatedBufferedBytes =
		selectedVideo && totalDuration > 0
			? Math.min(
					selectedVideo.sizeBytes,
					(bufferedSeconds / totalDuration) * selectedVideo.sizeBytes,
				)
			: 0;

	return (
		<Card className="metaPanel">
			<CardHeader>
				<CardTitle>Video metadata</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					<li>
						Total size:{" "}
						{selectedVideo ? formatBytes(selectedVideo.sizeBytes) : "-"}
					</li>
					<li>
						Chunks number: {selectedVideo ? selectedVideo.chunkCount : "-"}
					</li>
					<li>
						Current buffer size:{" "}
						{selectedVideo ? `~${formatBytes(estimatedBufferedBytes)}` : "-"}
					</li>
					<li>Buffered chunks loaded: {loadedSegmentCount}</li>
				</ul>
			</CardContent>
		</Card>
	);
}
