import {
	formatSpeakingCallStatus,
	type SpeakingCall,
} from "@/entities/speaking-session";
import { Badge } from "@/shared/ui/badge";
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
};

export function CallHistoryTable({ calls }: CallHistoryTableProps) {
	return (
		<div className="overflow-hidden rounded-lg border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-4 text-left">Status</TableHead>
						<TableHead>Level</TableHead>
						<TableHead>Source</TableHead>
						<TableHead>Explanation</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Duration</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{calls.map((call) => (
						<TableRow key={call.id}>
							<TableCell className="text-left">
								<Badge
									variant={
										call.status === "failed" ? "destructive" : "secondary"
									}
								>
									{formatSpeakingCallStatus(call.status)}
								</Badge>
							</TableCell>
							<TableCell>
								<span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px]">
									{call.languageLevel}
								</span>
							</TableCell>
							<TableCell>{call.sourceLanguage}</TableCell>
							<TableCell className="text-muted-foreground">
								{call.explanationLanguage ?? "—"}
							</TableCell>
							<TableCell className="text-muted-foreground">
								{call.date}
							</TableCell>
							<TableCell className="font-mono">{call.duration}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
