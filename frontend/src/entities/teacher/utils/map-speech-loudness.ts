import type { TeacherFaceSpeech } from "../model/teacher-face";

const ENTER_QUIET = 8;
const LEAVE_SILENT = 5;
const ENTER_NORMAL = 24;
const LEAVE_QUIET = 20;
const ENTER_LOUD = 48;
const LEAVE_NORMAL = 42;

export function mapSpeechLoudness(
	level: number,
	previous: TeacherFaceSpeech = "silent",
): TeacherFaceSpeech {
	if (previous === "silent") {
		return levelFromSilent(level);
	}
	if (previous === "quiet") {
		return levelFromQuiet(level);
	}
	if (previous === "normal") {
		return levelFromNormal(level);
	}
	return levelFromLoud(level);
}

function levelFromSilent(level: number): TeacherFaceSpeech {
	if (level >= ENTER_LOUD) {
		return "loud";
	}
	if (level >= ENTER_NORMAL) {
		return "normal";
	}
	if (level >= ENTER_QUIET) {
		return "quiet";
	}
	return "silent";
}

function levelFromQuiet(level: number): TeacherFaceSpeech {
	if (level < LEAVE_SILENT) {
		return "silent";
	}
	if (level >= ENTER_LOUD) {
		return "loud";
	}
	if (level >= ENTER_NORMAL) {
		return "normal";
	}
	return "quiet";
}

function levelFromNormal(level: number): TeacherFaceSpeech {
	if (level < LEAVE_SILENT) {
		return "silent";
	}
	if (level < LEAVE_QUIET) {
		return "quiet";
	}
	if (level >= ENTER_LOUD) {
		return "loud";
	}
	return "normal";
}

function levelFromLoud(level: number): TeacherFaceSpeech {
	if (level < LEAVE_SILENT) {
		return "silent";
	}
	if (level < LEAVE_QUIET) {
		return "quiet";
	}
	if (level < LEAVE_NORMAL) {
		return "normal";
	}
	return "loud";
}
