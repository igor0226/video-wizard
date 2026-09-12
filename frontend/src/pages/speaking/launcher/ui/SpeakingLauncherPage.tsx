"use client";

import { useState } from "react";

import { SPEAKING_TOPICS, useSpeakingCalls } from "@/entities/speaking-session";
import { useStartCall } from "@/features/start-call";
import { CallHistoryList, StartCallCard } from "@/widgets/call-launcher";
import { AppPageHeader } from "@/widgets/page-header";

export default function SpeakingLauncherPage() {
	const startCall = useStartCall();
	const [selectedTopicId, setSelectedTopicId] = useState(SPEAKING_TOPICS[0].id);
	const { calls, isLoading, errorMessage } = useSpeakingCalls();

	return (
		<main className="speakingPage">
			<AppPageHeader
				title="Speaking Practice"
				breadcrumbs={[
					{ label: "Home", href: "/dashboard" },
					{ label: "Speaking" },
				]}
			/>
			<StartCallCard
				topics={SPEAKING_TOPICS}
				selectedTopicId={selectedTopicId}
				onTopicSelect={setSelectedTopicId}
				onStartCall={() => startCall(selectedTopicId)}
			/>
			<CallHistoryList
				calls={calls}
				isLoading={isLoading}
				errorMessage={errorMessage}
			/>
		</main>
	);
}
