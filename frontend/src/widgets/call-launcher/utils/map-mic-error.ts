export function mapMicError(error: unknown): string {
	const name = error instanceof Error ? error.name : "";

	if (name === "NotAllowedError" || name === "PermissionDeniedError") {
		return "Microphone access was denied. Allow permission in your browser, then try again.";
	}
	if (name === "NotFoundError") {
		return "No microphone was found. Connect a mic and try again.";
	}
	if (name === "NotReadableError") {
		return "The microphone is already in use by another application.";
	}

	return "Could not access the microphone. Check your device settings and try again.";
}
