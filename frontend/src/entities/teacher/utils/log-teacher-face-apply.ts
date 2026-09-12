import type {
	TeacherFaceEmotion,
	TeacherFaceIntensity,
	TeacherFaceSpeech,
} from "../model/teacher-face";

import { logTeacherEmotionMismatch } from "@/shared/lib";
import {
	readTeacherFaceExpression,
	teacherFaceMatches,
} from "./read-teacher-face-expression";

export function logTeacherFaceApplyResult(
	svg: Element | null,
	emotion: TeacherFaceEmotion,
	intensity: TeacherFaceIntensity,
	speech: TeacherFaceSpeech,
): void {
	const expected = { emotion, intensity, speech };
	if (!svg) {
		logTeacherEmotionMismatch({ reason: "svg-missing", expected });
		return;
	}
	if (teacherFaceMatches(svg, emotion, intensity, speech)) {
		return;
	}
	logTeacherEmotionMismatch({
		reason: "svg-class",
		expected,
		actual: readTeacherFaceExpression(svg),
	});
}
