import type { CallControlState } from "@/entities/speaking-session";

import {
	BookMarked,
	Mic,
	MicOff,
	PhoneOff,
	Settings,
	Subtitles,
	Video,
	VideoOff,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { CallControlToggleButton } from "./CallControlToggleButton";

type CallControlDockProps = {
	controls: CallControlState;
	onToggleMute: () => void;
	onToggleCamera: () => void;
	onToggleCaptions: () => void;
	onTogglePanel: () => void;
	onEndCall: () => void;
};

export function CallControlDock({
	controls,
	onToggleMute,
	onToggleCamera,
	onToggleCaptions,
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
					label={controls.isVideoOff ? "Turn camera on" : "Turn camera off"}
					pressed={controls.isVideoOff}
					onClick={onToggleCamera}
				>
					{controls.isVideoOff ? <VideoOff /> : <Video />}
				</CallControlToggleButton>
				<CallControlToggleButton
					label="Toggle captions"
					pressed={controls.isCaptionsOn}
					onClick={onToggleCaptions}
				>
					<Subtitles />
				</CallControlToggleButton>
				<CallControlToggleButton
					label="Toggle learning drawer"
					pressed={controls.isPanelOpen}
					onClick={onTogglePanel}
				>
					<BookMarked />
				</CallControlToggleButton>
				<CallControlToggleButton
					label="Device settings"
					pressed={false}
					onClick={() => {}}
				>
					<Settings />
				</CallControlToggleButton>
				<Button type="button" onClick={onEndCall} aria-label="End Call">
					<PhoneOff className="mr-2 h-4 w-4" />
					End Call
				</Button>
			</div>
		</div>
	);
}
