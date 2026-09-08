import { Radio, User, Volume2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";
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
			<StatusBadge status={status} />
		</section>
	);
}

function AvatarMedia({
	media,
	label,
	isCallStage,
}: {
	media?: TeacherAvatarSlotProps["media"];
	label: string;
	isCallStage: boolean;
}) {
	if (!media?.src) {
		return null;
	}
	const fitClass = isCallStage
		? "h-full w-full object-contain"
		: "h-full w-full object-cover";
	if (media.type === "video") {
		return (
			<video
				src={media.src}
				autoPlay
				playsInline
				muted
				loop
				className={fitClass}
			/>
		);
	}
	return (
		<img
			src={media.src}
			alt={media.alt || label}
			className={fitClass}
			referrerPolicy="no-referrer"
		/>
	);
}

function StatusBadge({ status }: { status: TeacherAvatarStatus }) {
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
