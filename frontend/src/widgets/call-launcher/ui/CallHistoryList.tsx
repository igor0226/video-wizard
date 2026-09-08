"use client";

import type { SpeakingCall } from "@/entities/speaking-session";

import { useMemo, useState } from "react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";

type HistoryFilter = "all" | "completed" | "under10" | "over10";

type CallHistoryListProps = {
	calls: SpeakingCall[];
	onPracticeAgain: (topicId: string) => void;
};

export function CallHistoryList({
	calls,
	onPracticeAgain,
}: CallHistoryListProps) {
	const [filter, setFilter] = useState<HistoryFilter>("all");
	const visibleCalls = useMemo(
		() => calls.filter((call) => matchesFilter(call, filter)),
		[calls, filter],
	);

	return (
		<Card>
			<CardContent className="space-y-4 p-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 className="text-base font-bold">Past Speaking Sessions</h2>
						<p className="text-xs text-muted-foreground">
							Review pronunciation metrics and fluency scores from previous
							dialogue sessions.
						</p>
					</div>
					<FilterChips filter={filter} onChange={setFilter} />
				</div>
				{visibleCalls.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No speaking sessions recorded yet. Start your first call above.
					</p>
				) : (
					<HistoryTable
						calls={visibleCalls}
						onPracticeAgain={onPracticeAgain}
					/>
				)}
			</CardContent>
		</Card>
	);
}

function matchesFilter(call: SpeakingCall, filter: HistoryFilter): boolean {
	if (filter === "completed") {
		return call.status === "completed";
	}
	if (filter === "under10") {
		return call.durationSeconds < 600;
	}
	if (filter === "over10") {
		return call.durationSeconds >= 600;
	}
	return true;
}

function FilterChips({
	filter,
	onChange,
}: {
	filter: HistoryFilter;
	onChange: (filter: HistoryFilter) => void;
}) {
	const chips: Array<{ id: HistoryFilter; label: string }> = [
		{ id: "all", label: "All" },
		{ id: "completed", label: "Completed" },
		{ id: "under10", label: "Under 10 mins" },
		{ id: "over10", label: "Over 10 mins" },
	];

	return (
		<div className="flex flex-wrap gap-2">
			{chips.map((chip) => (
				<Button
					key={chip.id}
					type="button"
					size="sm"
					variant={filter === chip.id ? "default" : "outline"}
					onClick={() => onChange(chip.id)}
				>
					{chip.label}
				</Button>
			))}
		</div>
	);
}

function HistoryTable({
	calls,
	onPracticeAgain,
}: {
	calls: SpeakingCall[];
	onPracticeAgain: (topicId: string) => void;
}) {
	return (
		<div className="overflow-hidden rounded-lg border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Session ID</TableHead>
						<TableHead>Topic</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Duration</TableHead>
						<TableHead>Fluency</TableHead>
						<TableHead className="text-right">Action</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{calls.map((call) => (
						<TableRow key={call.id}>
							<TableCell className="font-mono">{call.callId}</TableCell>
							<TableCell>{call.topicTitle}</TableCell>
							<TableCell className="text-muted-foreground">
								{call.date}
							</TableCell>
							<TableCell className="font-mono">{call.duration}</TableCell>
							<TableCell>
								<Badge variant="secondary">{call.fluencyScore}%</Badge>
							</TableCell>
							<TableCell className="text-right">
								<Button
									type="button"
									variant="link"
									size="sm"
									onClick={() => onPracticeAgain(call.topicId)}
								>
									Practice Again
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
