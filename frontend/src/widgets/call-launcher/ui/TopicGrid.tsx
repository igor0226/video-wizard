import type { CallTopic } from "@/entities/speaking-session";

type TopicGridProps = {
	topics: CallTopic[];
	selectedTopicId: string;
	onTopicSelect: (id: string) => void;
};

export function TopicGrid({
	topics,
	selectedTopicId,
	onTopicSelect,
}: TopicGridProps) {
	return (
		<div className="space-y-3">
			<p className="text-xs font-semibold uppercase tracking-wider">
				Select Practice Scenario
			</p>
			<div className="topicGrid">
				{topics.map((topic) => {
					const isSelected = topic.id === selectedTopicId;
					return (
						<button
							key={topic.id}
							type="button"
							onClick={() => onTopicSelect(topic.id)}
							className={`topicCard ${isSelected ? "topicCardSelected" : ""}`}
							aria-pressed={isSelected}
						>
							<div className="mb-2 flex items-center justify-between">
								<span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px]">
									{topic.level}
								</span>
								<span className="font-mono text-[11px] text-muted-foreground">
									{topic.suggestedDurationMins}m
								</span>
							</div>
							<h3 className="text-xs font-bold">{topic.title}</h3>
							<p className="mt-1.5 line-clamp-2 text-[11px] text-muted-foreground">
								{topic.description}
							</p>
						</button>
					);
				})}
			</div>
		</div>
	);
}
