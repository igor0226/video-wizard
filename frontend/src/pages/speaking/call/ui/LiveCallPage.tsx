"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { SPEAKING_TOPICS } from "@/entities/speaking-session";
import {
	CallConnectedView,
	CallConnectingView,
	useMockCallConnection,
} from "@/widgets/live-call";

function LiveCallContent() {
	const params = useParams<{ callId: string }>();
	const searchParams = useSearchParams();
	const router = useRouter();
	const topicId = searchParams?.get("topic") ?? SPEAKING_TOPICS[0].id;
	const topic =
		SPEAKING_TOPICS.find((item) => item.id === topicId) ?? SPEAKING_TOPICS[0];
	const { step, phase, errorType, retry } = useMockCallConnection();

	if (phase === "connected") {
		return (
			<CallConnectedView
				topicTitle={topic.title}
				onEndCall={() => router.push("/speaking")}
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
			onCancel={() => router.push("/speaking")}
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
