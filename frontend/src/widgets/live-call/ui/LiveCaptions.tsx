type LiveCaptionsProps = {
	text: string;
	visible: boolean;
};

export function LiveCaptions({ text, visible }: LiveCaptionsProps) {
	if (!visible) {
		return null;
	}

	return (
		<div className="callCaptions">
			<p className="inline-block rounded-xl border border-border bg-background/85 px-5 py-2.5 text-sm leading-relaxed backdrop-blur-md">
				<span className="mr-2 font-mono text-xs text-muted-foreground">
					Elena:
				</span>
				{text}
			</p>
		</div>
	);
}
