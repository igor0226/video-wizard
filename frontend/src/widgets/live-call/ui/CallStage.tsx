import type { CallControlState } from "@/entities/speaking-session";

import { TeacherAvatarSlot } from "@/entities/teacher";
import { CallControlDock } from "./CallControlDock";

type CallStageProps = {
	controls: CallControlState;
	onToggle: (key: "isMuted" | "isPanelOpen") => void;
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
			</div>
			<CallControlDock
				controls={controls}
				onToggleMute={() => onToggle("isMuted")}
				onTogglePanel={() => onToggle("isPanelOpen")}
				onEndCall={onEndCall}
			/>
		</div>
	);
}
