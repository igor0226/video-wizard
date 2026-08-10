"use client";

import type { ProcessingHistoryEvent, ProcessingStep } from "../../types/video";

import { RotateCw } from "lucide-react";

import { formatEventAt } from "../../lib/format";
import {
	getProcessingEventStatusLabel,
	getProcessingStepLabel,
} from "../../lib/task-status";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

import "./ProcessingHistoryPanel.css";
import { useMemo } from "react";

type ProcessingHistoryPanelProps = {
	events: ProcessingHistoryEvent[] | null;
	currentStep: ProcessingStep | null;
	queuePosition: number | null;
	failureReason?: string | null;
	isLoading?: boolean;
	canRetry?: boolean;
	onRetry?: () => void;
	isRetrying?: boolean;
};

export function ProcessingHistoryPanel({
	events,
	currentStep,
	queuePosition,
	failureReason,
	isLoading = false,
	canRetry = false,
	onRetry,
	isRetrying = false,
}: ProcessingHistoryPanelProps) {
	const metaParts: string[] = [];
	if (currentStep) {
		metaParts.push(`Current: ${getProcessingStepLabel(currentStep)}`);
	}
	if (queuePosition != null) {
		metaParts.push(`Queue #${queuePosition}`);
	}

	const showFailureReason =
		Boolean(failureReason) &&
		!(events ?? []).some(
			(event) => event.status === "failed" && event.message === failureReason,
		);

	const lastFailedIndex = useMemo(() => {
		if (!events) return -1;

		const lastFailedIndex = [...events].reverse().findIndex((event) => event.status === "failed") ?? -1;
		return lastFailedIndex === -1 ? -1 : events.length - lastFailedIndex - 1;
	}, [events]);

	return (
		<section className="processingHistoryPanel" aria-label="Processing history">
			<div className="processingHistoryHeader">
				<h2 className="processingHistoryTitle">Processing history</h2>
				{metaParts.length > 0 ? (
					<p className="processingHistoryMeta">{metaParts.join(" · ")}</p>
				) : null}
			</div>

			{isLoading && !events ? (
				<p className="processingHistoryEmpty">Loading history…</p>
			) : null}

			{!isLoading && (!events || events.length === 0) ? (
				<p className="processingHistoryEmpty">No processing events yet.</p>
			) : null}

			{events && events.length > 0 ? (
				<ol className="processingHistoryList">
					{events.map((event, index) => {
						const key = `${event.step}-${event.status}-${event.at}-${index}`;
						const isLast = index === events.length - 1;
						const showRetry = canRetry && index === lastFailedIndex;

						return (
							<li key={key} className="processingHistoryItem">
								<div className="processingHistoryTrack">
									<span
										className="processingHistoryDot"
										data-status={event.status}
										aria-hidden
									/>
									{!isLast ? (
										<span className="processingHistoryLine" aria-hidden />
									) : null}
								</div>
								<div className="processingHistoryContent">
									<div className="processingHistoryRowHeader">
										<div className="processingHistoryRowText">
											<p className="processingHistoryStep">
												{getProcessingStepLabel(event.step)}
											</p>
											<p className="processingHistoryStatus">
												{getProcessingEventStatusLabel(event.status)} ·{" "}
												{formatEventAt(event.at)}
											</p>
										</div>
										{showRetry ? (
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={isRetrying}
												onClick={onRetry}
											>
												<RotateCw
													className={cn(
														"size-3.5 shrink-0 mr-1",
														isRetrying && "animate-spin",
													)}
													aria-hidden
												/>
												Retry
											</Button>
										) : null}
									</div>
									{event.message ? (
										<p
											className="processingHistoryMessage"
											data-status={event.status}
										>
											{event.message}
										</p>
									) : null}
								</div>
							</li>
						);
					})}
				</ol>
			) : null}

			{showFailureReason ? (
				<p className="processingHistoryMessage" data-status="failed">
					{failureReason}
				</p>
			) : null}
		</section>
	);
}
