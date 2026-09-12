export type TeacherFaceEmotion =
	| "neutral"
	| "smile"
	| "laugh"
	| "upset"
	| "surprised"
	| "angry"
	| "thoughtful";

export type TeacherFaceIntensity = 1 | 2 | 3;

export type TeacherFaceSpeech = "silent" | "quiet" | "normal" | "loud";

export const DEFAULT_TEACHER_FACE_EMOTION: TeacherFaceEmotion = "neutral";
export const DEFAULT_TEACHER_FACE_INTENSITY: TeacherFaceIntensity = 1;
export const DEFAULT_TEACHER_FACE_SPEECH: TeacherFaceSpeech = "silent";
