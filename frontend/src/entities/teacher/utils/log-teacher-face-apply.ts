import type {
	TeacherFaceEmotion,
	TeacherFaceIntensity,
	TeacherFaceSpeech,
} from "../model/teacher-face";

import { logTeacherEmotionMismatch } from "@/shared/lib";

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
}
