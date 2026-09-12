import type { CallControlState } from "@/entities/speaking-session";

import { BookMarked, Mic, MicOff, PhoneOff } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { CallControlToggleButton } from "./CallControlToggleButton";

type CallControlDockProps = {
	controls: CallControlState;
	onToggleMute: () => void;
	onTogglePanel: () => void;
	onEndCall: () => void;
};

export function CallControlDock({
	controls,
	onToggleMute,
	onTogglePanel,
	onEndCall,
}: CallControlDockProps) {
	return (
		<div className="callDock">
			<div className="callDockInner">
				<CallControlToggleButton
					label={controls.isMuted ? "Unmute microphone" : "Mute microphone"}
					pressed={controls.isMuted}
					onClick={onToggleMute}
				>
					{controls.isMuted ? <MicOff /> : <Mic />}
				</CallControlToggleButton>
				<CallControlToggleButton
					label="Toggle learning drawer"
					pressed={controls.isPanelOpen}
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
