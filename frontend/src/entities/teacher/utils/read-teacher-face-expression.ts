import type {
	TeacherFaceEmotion,
	TeacherFaceIntensity,
	TeacherFaceSpeech,
} from "../model/teacher-face";

export type TeacherFaceExpression = {
	emotion?: string;
	intensity?: string;
	speech?: string;
};

export function readTeacherFaceExpression(svg: Element): TeacherFaceExpression {
	return {
		emotion: classSuffix(svg, "emotion-"),
		intensity: classSuffix(svg, "intensity-"),
		speech: classSuffix(svg, "speech-"),
	};
}

export function teacherFaceMatches(
	svg: Element,
	emotion: TeacherFaceEmotion,
	intensity: TeacherFaceIntensity,
	speech: TeacherFaceSpeech,
): boolean {
	const actual = readTeacherFaceExpression(svg);
	return (
		actual.emotion === emotion &&
		actual.intensity === String(intensity) &&
		actual.speech === speech
	);
}

function classSuffix(svg: Element, prefix: string): string | undefined {
	return [...svg.classList]
		.find((name) => name.startsWith(prefix))
		?.slice(prefix.length);
}
