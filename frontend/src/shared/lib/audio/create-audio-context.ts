type AudioContextGlobals = {
	AudioContext?: typeof AudioContext;
	webkitAudioContext?: typeof AudioContext;
};

export function createAudioContext(): AudioContext {
	const view = window as unknown as AudioContextGlobals;
	const AudioContextCtor = view.AudioContext ?? view.webkitAudioContext;

	if (!AudioContextCtor) {
		throw new Error("Web Audio API is not supported in this browser.");
	}

	return new AudioContextCtor();
}
