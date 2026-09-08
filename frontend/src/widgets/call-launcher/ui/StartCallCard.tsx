"use client";

import type { CallTopic } from "@/entities/speaking-session";

import { CheckCircle2, Mic, Play } from "lucide-react";
import { useState } from "react";

import { TeacherAvatarSlot } from "@/entities/teacher";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

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

function TopicGrid({
	topics,
	selectedTopicId,
	onTopicSelect,
}: {
	topics: CallTopic[];
	selectedTopicId: string;
	onTopicSelect: (id: string) => void;
}) {
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

function DeviceReadiness() {
	const [isMicTesting, setIsMicTesting] = useState(false);

	return (
		<div className="space-y-3 rounded-xl border border-border bg-muted p-4">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
						<Mic className="h-4 w-4" />
					</div>
					<div>
						<div className="flex items-center gap-1.5 text-xs font-semibold">
							Microphone Status
							<CheckCircle2 className="h-3.5 w-3.5" />
						</div>
						<p className="font-mono text-[11px] text-muted-foreground">
							Default System Input · Ready
						</p>
					</div>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setIsMicTesting((value) => !value)}
				>
					{isMicTesting ? "Stop Audio Check" : "Test Audio Level"}
				</Button>
			</div>
			{isMicTesting ? (
				<div className="micMeter" role="img" aria-label="Input gain level">
					<div className="h-full w-1/4 rounded-sm bg-foreground" />
					<div className="h-full w-1/4 rounded-sm bg-foreground" />
					<div className="h-full w-1/4 rounded-sm bg-foreground/60" />
					<div className="h-full w-1/4 rounded-sm bg-muted-foreground/30" />
				</div>
			) : null}
		</div>
	);
}

function LaunchPreview({
	topic,
	onStartCall,
}: {
	topic: CallTopic;
	onStartCall: () => void;
}) {
	return (
		<Card className="lg:col-span-4">
			<CardContent className="flex h-full flex-col justify-between p-6">
				<div className="space-y-5 text-center">
					<div className="flex flex-col items-center">
						<TeacherAvatarSlot
							size="lg"
							status="idle"
							fallbackLabel="Elena · AI Instructor"
							className="mb-3"
						/>
						<div className="text-sm font-bold">Elena (AI Language Teacher)</div>
					</div>
					<div className="space-y-2 border-t border-border pt-4 text-left text-xs">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Selected Topic:</span>
							<span className="max-w-[180px] truncate font-semibold">
								{topic.title}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Target Level:</span>
							<span className="font-semibold">{topic.level}</span>
						</div>
					</div>
				</div>
				<Button
					type="button"
					className="mt-6 w-full"
					onClick={onStartCall}
					aria-label="Start speaking call"
				>
					<Play className="mr-2 h-3.5 w-3.5 fill-current" />
					Start Session with AI Teacher
				</Button>
			</CardContent>
		</Card>
	);
}
