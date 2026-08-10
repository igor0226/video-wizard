import type { ProcessingHistoryEvent, ProcessingStep } from "../../types/video";

import { formatEventAt } from "../../lib/format";
import {
	getProcessingEventStatusLabel,
	getProcessingStepLabel,
} from "../../lib/task-status";

import "./ProcessingHistoryPanel.css";

type ProcessingHistoryPanelProps = {
	events: ProcessingHistoryEvent[] | null;
	currentStep: ProcessingStep | null;
	queuePosition: number | null;
	failureReason?: string | null;
	isLoading?: boolean;
};

export function ProcessingHistoryPanel({
	events,
	currentStep,
	queuePosition,
	failureReason,
	isLoading = false,
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
									<p className="processingHistoryStep">
										{getProcessingStepLabel(event.step)}
									</p>
									<p className="processingHistoryStatus">
										{getProcessingEventStatusLabel(event.status)} ·{" "}
										{formatEventAt(event.at)}
									</p>
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
