export type LearningMode = "listening" | "writing" | "speaking";

export type VideoProcessingStatus =
	| "Completed"
	| "Processing"
	| "Queued"
	| "Failed";

export type HeatmapIntensity = 0 | 1 | 2 | 3;

export type ActivityHeatmapEntry = {
	date: string;
	value: number;
	label: string;
	intensity: HeatmapIntensity;
};

export type LearningMetric = {
	id: string;
	label: string;
	value: string;
	delta: string;
	period: string;
};

export type RecentActivity = {
	id: string;
	taskId: string;
	title: string;
	mode: LearningMode;
	date: string;
	status: VideoProcessingStatus;
	duration: string;
	score?: number;
};

export function parseLearningMode(value: string | null): LearningMode {
	if (value === "speaking" || value === "listening") {
		return value;
	}
	return "listening";
}
