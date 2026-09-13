import type {
	TeacherFaceEmotion,
	TeacherFaceIntensity,
	TeacherFaceSpeech,
} from "../model/teacher-face";

import {
	DEFAULT_TEACHER_FACE_EMOTION,
	DEFAULT_TEACHER_FACE_INTENSITY,
	DEFAULT_TEACHER_FACE_SPEECH,
} from "../model/teacher-face";

export function applyTeacherFaceExpression(
	svg: Element,
	emotion: TeacherFaceEmotion = DEFAULT_TEACHER_FACE_EMOTION,
	intensity: TeacherFaceIntensity = DEFAULT_TEACHER_FACE_INTENSITY,
	speech: TeacherFaceSpeech = DEFAULT_TEACHER_FACE_SPEECH,
): void {
	const next = [...svg.classList].filter(
		(name) =>
			!name.startsWith("emotion-") &&
			!name.startsWith("intensity-") &&
			!name.startsWith("speech-"),
	);
	next.push(`emotion-${emotion}`, `intensity-${intensity}`, `speech-${speech}`);
	svg.setAttribute("class", next.join(" "));
}
