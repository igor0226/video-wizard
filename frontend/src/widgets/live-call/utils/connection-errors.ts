export function isMicDenied(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}
	return (
		error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
	);
}

export function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError";
}

export function throwIfAborted(signal: AbortSignal): void {
	if (signal.aborted) {
		throw new DOMException("Aborted", "AbortError");
	}
}
