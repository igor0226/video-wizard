"use client";

import { useState } from "react";

import { CALL_HISTORY, SPEAKING_TOPICS } from "@/entities/speaking-session";
import { useStartCall } from "@/features/start-call";
import { CallHistoryList, StartCallCard } from "@/widgets/call-launcher";
import { AppPageHeader } from "@/widgets/page-header";

export default function SpeakingLauncherPage() {
	const startCall = useStartCall();
	const [selectedTopicId, setSelectedTopicId] = useState(SPEAKING_TOPICS[0].id);

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
				calls={CALL_HISTORY}
				onPracticeAgain={(topicId) => startCall(topicId)}
			/>
		</main>
	);
}
