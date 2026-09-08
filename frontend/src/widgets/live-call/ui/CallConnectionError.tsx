import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

type CallConnectionErrorProps = {
	message: string;
	onRetry: () => void;
	onCancel: () => void;
};

export function CallConnectionError({
	message,
	onRetry,
	onCancel,
}: CallConnectionErrorProps) {
	return (
		<Alert className="text-left">
			<AlertTitle>Connection failed</AlertTitle>
			<AlertDescription className="space-y-3">
				<p>{message}</p>
				<div className="flex gap-2">
					<Button type="button" size="sm" onClick={onRetry}>
						Try Again
					</Button>
					<Button type="button" size="sm" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	);
}
