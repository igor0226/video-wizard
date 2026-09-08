import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";

type EndCallDialogProps = {
	open: boolean;
	savedCount: number;
	onContinue: () => void;
	onConfirm: () => void;
};

export function EndCallDialog({
	open,
	savedCount,
	onContinue,
	onConfirm,
}: EndCallDialogProps) {
	return (
		<Dialog open={open} onOpenChange={(next) => !next && onContinue()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>End Practice Session?</DialogTitle>
					<DialogDescription>
						Your audio transcript and {savedCount} saved vocabulary terms will
						be indexed into your speaking analytics.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onContinue}>
						Continue Call
					</Button>
					<Button type="button" onClick={onConfirm}>
						Confirm End
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
