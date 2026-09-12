"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import {
	formatSpeakingTopicText,
	parseCefrLevel,
	SPEAKING_TOPICS,
} from "@/entities/speaking-session";
import {
	CallConnectedView,
	CallConnectingView,
	useLiveCallConnection,
} from "@/widgets/live-call";

function LiveCallContent() {
	const params = useParams<{ callId: string }>();
	const searchParams = useSearchParams();
	const router = useRouter();
	const topicId = searchParams?.get("topic") ?? SPEAKING_TOPICS[0].id;
	const topic =
		SPEAKING_TOPICS.find((item) => item.id === topicId) ?? SPEAKING_TOPICS[0];
	const {
		step,
		phase,
		errorType,
		retry,
		endCall,
		toggleMic,
		teacherEmotion,
		teacherAudioStream,
	} = useLiveCallConnection({
		sourceLanguage: "English",
		explanationLanguage: "English",
		languageLevel: parseCefrLevel(topic.level),
		topic: formatSpeakingTopicText(topic),
	});

	const leaveSpeaking = () => {
		void endCall().finally(() => router.push("/speaking"));
	};

	if (phase === "connected") {
		return (
			<CallConnectedView
				topicTitle={topic.title}
				emotion={teacherEmotion.emotion}
				intensity={teacherEmotion.intensity}
				teacherAudioStream={teacherAudioStream}
				onEndCall={leaveSpeaking}
				onToggleMute={() => {
					void toggleMic();
				}}
			/>
		);
	}

	return (
		<CallConnectingView
			topicTitle={`${topic.title} · ${params?.callId ?? ""}`}
			step={step}
			phase={phase}
			errorType={errorType}
			onRetry={retry}
			onCancel={leaveSpeaking}
		/>
	);
}

export default function LiveCallPage() {
	return (
		<Suspense>
			<LiveCallContent />
		</Suspense>
	);
}
