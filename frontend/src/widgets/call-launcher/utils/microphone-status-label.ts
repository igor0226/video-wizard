type MicrophoneStatusLabelInput = {
	error: string | null;
	isStarting: boolean;
	isTesting: boolean;
	heardInput: boolean;
	deviceLabel: string | null;
};

export function microphoneStatusLabel(
	input: MicrophoneStatusLabelInput,
): string {
	if (input.error) {
		return input.error;
	}

	const device = input.deviceLabel ?? "Default System Input";

	if (input.isStarting) {
		return "Requesting microphone access…";
	}
	if (input.isTesting && input.heardInput) {
		return `${device} · Receiving audio`;
	}
	if (input.isTesting) {
		return `${device} · Speak to see the level`;
	}
	if (input.heardInput) {
		return `${device} · Ready`;
	}
	if (input.deviceLabel) {
		return `${device} · No input detected`;
	}

	return `${device} · Not checked`;
}
