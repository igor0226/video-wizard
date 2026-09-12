"use client";

import type { SpeakingCall } from "@/entities/speaking-session";

import { useMemo, useState } from "react";

import { Card, CardContent } from "@/shared/ui/card";
import {
	type HistoryFilter,
	matchesCallHistoryFilter,
} from "../utils/matches-call-history-filter";
import { CallHistoryFilterChips } from "./CallHistoryFilterChips";
import { CallHistoryTable } from "./CallHistoryTable";

type CallHistoryListProps = {
	calls: SpeakingCall[];
	isLoading?: boolean;
	errorMessage?: string | null;
};

export function CallHistoryList({
	calls,
	isLoading = false,
	errorMessage,
}: CallHistoryListProps) {
	const [filter, setFilter] = useState<HistoryFilter>("all");
	const visibleCalls = useMemo(
		() => calls.filter((call) => matchesCallHistoryFilter(call, filter)),
		[calls, filter],
	);

	return (
		<Card>
			<CardContent className="space-y-4 p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-base font-bold">Past Speaking Sessions</h2>
						<p className="text-xs text-muted-foreground">
							Review duration and status from previous dialogue sessions.
						</p>
					</div>
					<CallHistoryFilterChips filter={filter} onChange={setFilter} />
				</div>
				{historyBody({
					isLoading,
					errorMessage,
					visibleCalls,
				})}
			</CardContent>
		</Card>
	);
}

function historyBody(input: {
	isLoading: boolean;
	errorMessage?: string | null;
	visibleCalls: SpeakingCall[];
}) {
	if (input.isLoading) {
		return (
			<p className="text-sm text-muted-foreground">
				Loading speaking sessions…
			</p>
		);
	}
	if (input.errorMessage) {
		return <p className="text-sm text-destructive">{input.errorMessage}</p>;
	}
	if (input.visibleCalls.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No speaking sessions recorded yet. Start your first call above.
			</p>
		);
	}
	return <CallHistoryTable calls={input.visibleCalls} />;
}
