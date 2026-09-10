import { User } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { AvatarMedia } from "./AvatarMedia";
import { TeacherAvatarStatusBadge } from "./TeacherAvatarStatusBadge";
import "./TeacherAvatarSlot.css";

export type TeacherAvatarStatus =
	| "idle"
	| "connecting"
	| "speaking"
	| "listening"
	| "unavailable";

export type TeacherAvatarSlotProps = {
	media?: {
		type: "image" | "video" | "external";
		src?: string;
		alt?: string;
	};
	size: "sm" | "md" | "lg" | "call-stage";
	status?: TeacherAvatarStatus;
	label?: string;
	fallbackLabel?: string;
	className?: string;
};

export function TeacherAvatarSlot({
	media,
	size,
	status = "idle",
	label = "AI Teacher Elena",
	fallbackLabel = "AI Teacher",
	className,
}: TeacherAvatarSlotProps) {
	const isCallStage = size === "call-stage";

	return (
		<section
			aria-label={label}
			className={cn(
				"teacherSlot",
				`teacherSlot-${size}`,
				`teacherStatus-${status}`,
				className,
			)}
		>
			<AvatarMedia media={media} label={label} isCallStage={isCallStage} />
			{!media?.src ? (
				<div className="flex flex-col items-center justify-center p-4 text-center">
					<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
						<User className="h-6 w-6 text-muted-foreground" />
					</div>
					<span className="text-xs font-medium">{fallbackLabel}</span>
				</div>
			) : null}
			<TeacherAvatarStatusBadge status={status} />
		</section>
	);
}
