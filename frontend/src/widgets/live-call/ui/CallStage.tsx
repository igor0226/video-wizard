import { TeacherAvatarSlot } from "@/entities/teacher";
import { CallControlDock } from "./CallControlDock";

type CallStageProps = {
	isMuted: boolean;
	isPanelOpen: boolean;
	onToggleMute: () => void;
	onTogglePanel: () => void;
	onEndCall: () => void;
};

export function CallStage({
	isMuted,
	isPanelOpen,
	onToggleMute,
	onTogglePanel,
	onEndCall,
}: CallStageProps) {
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
				isMuted={isMuted}
				isPanelOpen={isPanelOpen}
				onToggleMute={onToggleMute}
				onTogglePanel={onTogglePanel}
				onEndCall={onEndCall}
			/>
		</div>
	);
}
