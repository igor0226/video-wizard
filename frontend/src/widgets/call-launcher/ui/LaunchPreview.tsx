import type { CallTopic } from "@/entities/speaking-session";

import { Play } from "lucide-react";

import { TeacherAvatarSlot, TeacherFace } from "@/entities/teacher";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

type LaunchPreviewProps = {
	topic: CallTopic;
	onStartCall: () => void;
};

export function LaunchPreview({ topic, onStartCall }: LaunchPreviewProps) {
	return (
		<Card className="lg:col-span-4">
			<CardContent className="flex h-full flex-col justify-between p-6">
				<div className="space-y-5 text-center">
					<div className="flex flex-col items-center">
						<TeacherAvatarSlot size="lg" status="idle" className="mb-3">
							<TeacherFace staticMotion />
						</TeacherAvatarSlot>
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
