import type { TeacherAvatarStatus } from "./TeacherAvatarSlot";

import { Radio, Volume2 } from "lucide-react";

type TeacherAvatarStatusBadgeProps = {
	status: TeacherAvatarStatus;
};

export function TeacherAvatarStatusBadge({
	status,
}: TeacherAvatarStatusBadgeProps) {
	if (status === "speaking") {
		return (
			<div className="teacherSlotBadge" aria-hidden>
				<Volume2 className="h-3.5 w-3.5 animate-pulse" />
				Speaking
			</div>
		);
	}
	if (status === "connecting") {
		return (
			<div className="teacherSlotBadge" aria-hidden>
				<Radio className="h-3.5 w-3.5 animate-spin" />
				Handshake...
			</div>
		);
	}
	return null;
}
