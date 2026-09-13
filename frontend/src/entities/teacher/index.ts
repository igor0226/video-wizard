export type {
	TeacherFaceEmotion,
	TeacherFaceIntensity,
	TeacherFaceSpeech,
} from "./model/teacher-face";

export { TEACHER_AVATAR_MEDIA } from "./model/teacher-avatar";
export {
	DEFAULT_TEACHER_FACE_EMOTION,
	DEFAULT_TEACHER_FACE_INTENSITY,
	DEFAULT_TEACHER_FACE_SPEECH,
} from "./model/teacher-face";
export {
	TeacherAvatarSlot,
	type TeacherAvatarSlotProps,
	type TeacherAvatarStatus,
} from "./ui/TeacherAvatarSlot";
export { TeacherFace } from "./ui/TeacherFace";
export { mapSpeechLoudness } from "./utils/map-speech-loudness";
