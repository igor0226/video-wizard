"use client";

import type { CallTopic } from "@/entities/speaking-session";

import { Card, CardContent } from "@/shared/ui/card";
import { DeviceReadiness } from "./DeviceReadiness";
import { LaunchPreview } from "./LaunchPreview";
import { TopicGrid } from "./TopicGrid";

type StartCallCardProps = {
	topics: CallTopic[];
	selectedTopicId: string;
	onTopicSelect: (id: string) => void;
	onStartCall: () => void;
};

export function StartCallCard({
	topics,
	selectedTopicId,
	onTopicSelect,
	onStartCall,
}: StartCallCardProps) {
	const selected =
		topics.find((topic) => topic.id === selectedTopicId) ?? topics[0];

	return (
		<div className="speakingLauncher">
			<Card className="lg:col-span-8">
				<CardContent className="space-y-6 p-6">
					<div>
						<h2 className="text-base font-bold">
							Configure Interactive Conversation
						</h2>
						<p className="mt-1 text-xs text-muted-foreground">
							Select a contextual scenario to engage in natural spoken dialogue
							with the AI instructor.
						</p>
					</div>
					<TopicGrid
						topics={topics}
						selectedTopicId={selectedTopicId}
						onTopicSelect={onTopicSelect}
					/>
					<DeviceReadiness />
				</CardContent>
			</Card>
			<LaunchPreview topic={selected} onStartCall={onStartCall} />
		</div>
	);
}
