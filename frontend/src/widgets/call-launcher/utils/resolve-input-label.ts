export function resolveInputLabel(
	stream: Pick<MediaStream, "getAudioTracks">,
): string {
	const label = stream.getAudioTracks()[0]?.label?.trim();
	return label || "Default System Input";
}
