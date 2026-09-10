import type { SpeakingCall } from "@/entities/speaking-session";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";

type CallHistoryTableProps = {
	calls: SpeakingCall[];
	onPracticeAgain: (topicId: string) => void;
};

export function CallHistoryTable({
	calls,
	onPracticeAgain,
}: CallHistoryTableProps) {
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
