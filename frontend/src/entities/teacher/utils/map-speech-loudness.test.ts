import { mapSpeechLoudness } from "./map-speech-loudness";

describe("mapSpeechLoudness", () => {
	it("maps a silent start into the three speaking levels", () => {
		expect(mapSpeechLoudness(0)).toBe("silent");
		expect(mapSpeechLoudness(8)).toBe("quiet");
		expect(mapSpeechLoudness(24)).toBe("normal");
		expect(mapSpeechLoudness(48)).toBe("loud");
	});

	it("uses hysteresis so nearby values do not flicker", () => {
		expect(mapSpeechLoudness(6, "quiet")).toBe("quiet");
		expect(mapSpeechLoudness(4, "quiet")).toBe("silent");
		expect(mapSpeechLoudness(22, "normal")).toBe("normal");
		expect(mapSpeechLoudness(19, "normal")).toBe("quiet");
		expect(mapSpeechLoudness(44, "loud")).toBe("loud");
		expect(mapSpeechLoudness(41, "loud")).toBe("normal");
	});
});
