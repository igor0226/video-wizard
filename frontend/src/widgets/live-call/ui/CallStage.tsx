import {
	TeacherAvatarSlot,
	TeacherFace,
	type TeacherFaceEmotion,
	type TeacherFaceIntensity,
	type TeacherFaceSpeech,
} from "@/entities/teacher";
import { CallControlDock } from "./CallControlDock";

type CallStageProps = {
	emotion: TeacherFaceEmotion;
	intensity: TeacherFaceIntensity;
	speech: TeacherFaceSpeech;
	isMuted: boolean;
	isPanelOpen: boolean;
	onToggleMute: () => void;
	onTogglePanel: () => void;
	onEndCall: () => void;
};

export function CallStage({
	emotion,
	intensity,
	speech,
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
				>
					<TeacherFace
						emotion={emotion}
						intensity={intensity}
						speech={speech}
					/>
				</TeacherAvatarSlot>
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
