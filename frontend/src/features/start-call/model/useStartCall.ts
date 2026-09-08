"use client";

import { useRouter } from "next/navigation";

export function useStartCall() {
	const router = useRouter();

	return (topicId: string) => {
		const callId = `CALL-${Math.floor(1000 + Math.random() * 9000)}`;
		router.push(`/speaking/call/${callId}?topic=${topicId}`);
	};
}
