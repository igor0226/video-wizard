"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getAnonymousUserId } from "@/shared/lib";
import { fetchSpeakingCalls } from "./fetchSpeakingCalls";

export function useSpeakingCalls() {
	const userId = useAnonymousUserId();
	const query = useQuery({
		queryKey: ["speaking-calls", userId],
		queryFn: () => fetchSpeakingCalls(userId ?? ""),
		enabled: Boolean(userId),
	});

	return {
		calls: query.data ?? [],
		isLoading: !userId || query.isPending,
		errorMessage: query.error instanceof Error ? query.error.message : null,
	};
}

function useAnonymousUserId(): string | null {
	const [userId, setUserId] = useState<string | null>(null);
	useEffect(() => {
		setUserId(getAnonymousUserId());
	}, []);
	return userId;
}
