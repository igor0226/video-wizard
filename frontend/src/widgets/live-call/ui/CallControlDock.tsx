import { BookMarked, Mic, MicOff, PhoneOff } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { CallControlToggleButton } from "./CallControlToggleButton";

type CallControlDockProps = {
	isMuted: boolean;
	isPanelOpen: boolean;
	onToggleMute: () => void;
	onTogglePanel: () => void;
	onEndCall: () => void;
};

export function CallControlDock({
	isMuted,
	isPanelOpen,
	onToggleMute,
	onTogglePanel,
	onEndCall,
}: CallControlDockProps) {
	return (
		<div className="callDock">
			<div className="callDockInner">
				<CallControlToggleButton
					label={isMuted ? "Unmute microphone" : "Mute microphone"}
					pressed={isMuted}
					onClick={onToggleMute}
				>
					{isMuted ? <MicOff /> : <Mic />}
				</CallControlToggleButton>
				<CallControlToggleButton
					label="Toggle saved phrases"
					pressed={isPanelOpen}
					onClick={onTogglePanel}
				>
					<BookMarked />
				</CallControlToggleButton>
				<Button type="button" onClick={onEndCall} aria-label="End Call">
					<PhoneOff className="mr-2 h-4 w-4" />
					End Call
				</Button>
			</div>
		</div>
	);
}
