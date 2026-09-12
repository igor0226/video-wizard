import type { TeacherAvatarSlotProps } from "./TeacherAvatarSlot";

type AvatarMediaProps = {
	media?: TeacherAvatarSlotProps["media"];
	label: string;
	isCallStage: boolean;
};

export function AvatarMedia({ media, label, isCallStage }: AvatarMediaProps) {
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
