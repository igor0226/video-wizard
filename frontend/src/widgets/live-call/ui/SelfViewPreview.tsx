import { MicOff, VideoOff } from "lucide-react";

type SelfViewPreviewProps = {
	isCameraOff: boolean;
	isMuted: boolean;
};

export function SelfViewPreview({
	isCameraOff,
	isMuted,
}: SelfViewPreviewProps) {
	return (
		<div className="callSelfView">
			{isCameraOff ? (
				<div className="flex h-full flex-col items-center justify-center text-[11px] text-muted-foreground">
					<VideoOff className="mb-1 h-5 w-5" />
					Camera Off
				</div>
			) : (
				<div className="relative flex h-full items-center justify-center bg-muted">
					<span className="text-xs font-semibold">You (Self View)</span>
					{isMuted ? (
						<div className="absolute bottom-2 left-2 rounded-md bg-background/80 p-1">
							<MicOff className="h-3 w-3" />
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}
