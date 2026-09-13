import type { TeacherFaceSpeech } from "../model/teacher-face";

const BANDS: readonly {
	speech: TeacherFaceSpeech;
	enter: number;
	stay: number;
}[] = [
	{ speech: "silent", enter: 0, stay: 0 },
	{ speech: "quiet", enter: 8, stay: 5 },
	{ speech: "normal", enter: 24, stay: 20 },
	{ speech: "loud", enter: 48, stay: 42 },
];

export function mapSpeechLoudness(
	level: number,
	previous: TeacherFaceSpeech = "silent",
): TeacherFaceSpeech {
	const current = BANDS.findIndex((band) => band.speech === previous);
	for (let index = BANDS.length - 1; index >= 0; index -= 1) {
		const band = BANDS[index];
		const threshold = index > current ? band.enter : band.stay;
		if (level >= threshold) {
			return band.speech;
		}
	}
	return "silent";
}
