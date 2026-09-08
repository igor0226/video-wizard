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
				<ToggleButton
					label={controls.isMuted ? "Unmute microphone" : "Mute microphone"}
					pressed={controls.isMuted}
					onClick={onToggleMute}
				>
					{controls.isMuted ? <MicOff /> : <Mic />}
				</ToggleButton>
				<ToggleButton
					label={controls.isVideoOff ? "Turn camera on" : "Turn camera off"}
					pressed={controls.isVideoOff}
					onClick={onToggleCamera}
				>
					{controls.isVideoOff ? <VideoOff /> : <Video />}
				</ToggleButton>
				<ToggleButton
					label="Toggle captions"
					pressed={controls.isCaptionsOn}
					onClick={onToggleCaptions}
				>
					<Subtitles />
				</ToggleButton>
				<ToggleButton
					label="Toggle learning drawer"
					pressed={controls.isPanelOpen}
					onClick={onTogglePanel}
				>
					<BookMarked />
				</ToggleButton>
				<ToggleButton
					label="Device settings"
					pressed={false}
					onClick={() => {}}
				>
					<Settings />
				</ToggleButton>
				<Button type="button" onClick={onEndCall} aria-label="End Call">
					<PhoneOff className="mr-2 h-4 w-4" />
					End Call
				</Button>
			</div>
		</div>
	);
}

function ToggleButton({
	label,
	pressed,
	onClick,
	children,
}: {
	label: string;
	pressed: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Button
			type="button"
			size="icon"
			variant={pressed ? "secondary" : "ghost"}
			aria-label={label}
			aria-pressed={pressed}
			onClick={onClick}
		>
			{children}
		</Button>
	);
}
