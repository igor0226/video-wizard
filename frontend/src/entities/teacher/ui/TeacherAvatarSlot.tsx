import type { ReactNode } from "react";

import { User } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { AvatarMedia } from "./AvatarMedia";
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
	children?: ReactNode;
};

export function TeacherAvatarSlot({
	media,
	size,
	status = "idle",
	label = "AI Teacher Elena",
	className,
	children,
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
			{children ?? (
				<AvatarMedia media={media} label={label} isCallStage={isCallStage} />
			)}
			{!children && !media?.src ? (
				<div className="flex flex-col items-center justify-center p-4 text-center">
					<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
						<User className="h-6 w-6 text-muted-foreground" />
					</div>
				</div>
			) : null}
		</section>
	);
}
