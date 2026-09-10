import type { CallControlState } from "@/entities/speaking-session";

import { LIVE_CAPTION } from "@/entities/speaking-session";
import { TeacherAvatarSlot } from "@/entities/teacher";
import { CallControlDock } from "./CallControlDock";
import { LiveCaptions } from "./LiveCaptions";
import { SelfViewPreview } from "./SelfViewPreview";

type CallStageProps = {
	controls: CallControlState;
	onToggle: (
		key: "isMuted" | "isVideoOff" | "isCaptionsOn" | "isPanelOpen",
	) => void;
	onEndCall: () => void;
};

export function CallStage({ controls, onToggle, onEndCall }: CallStageProps) {
	return (
		<div className="callStage">
			<div className="callStageCanvas">
				<TeacherAvatarSlot
					size="call-stage"
					status="speaking"
					fallbackLabel="Elena (AI Instructor)"
				/>
				<SelfViewPreview
					isCameraOff={controls.isVideoOff}
					isMuted={controls.isMuted}
				/>
				<LiveCaptions text={LIVE_CAPTION} visible={controls.isCaptionsOn} />
			</div>
			<CallControlDock
				controls={controls}
				onToggleMute={() => onToggle("isMuted")}
				onToggleCamera={() => onToggle("isVideoOff")}
				onToggleCaptions={() => onToggle("isCaptionsOn")}
				onTogglePanel={() => onToggle("isPanelOpen")}
				onEndCall={onEndCall}
			/>
		</div>
	);
}
