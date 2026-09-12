import { TEACHER_EMOTION_TOPIC } from "@/entities/speaking-session";
import {
	dispatchTeacherEmotion,
	resolveDataTopic,
} from "./dispatch-teacher-emotion";

function encode(value: unknown): Uint8Array {
	return new TextEncoder().encode(JSON.stringify(value));
}

describe("resolveDataTopic", () => {
	it("prefers the explicit topic argument", () => {
		expect(resolveDataTopic(1, TEACHER_EMOTION_TOPIC)).toBe(
			TEACHER_EMOTION_TOPIC,
		);
	});

	it("falls back when topic is passed as the kind argument", () => {
		expect(resolveDataTopic(TEACHER_EMOTION_TOPIC, undefined)).toBe(
			TEACHER_EMOTION_TOPIC,
		);
	});
});

describe("dispatchTeacherEmotion", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("forwards a valid teacher-emotion payload", () => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
		const onTeacherEmotion = vi.fn();

		dispatchTeacherEmotion(
			encode({ emotion: "smile", intensity: 2, source: "reply" }),
			TEACHER_EMOTION_TOPIC,
			onTeacherEmotion,
		);

		expect(onTeacherEmotion).toHaveBeenCalledWith({
			emotion: "smile",
			intensity: 2,
			source: "reply",
		});
	});

	it("logs a received emotion", () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

		dispatchTeacherEmotion(
			encode({ emotion: "smile", intensity: 2, source: "reply" }),
			TEACHER_EMOTION_TOPIC,
			vi.fn(),
		);

		expect(log).toHaveBeenCalledWith("teacher-emotion", {
			emotion: "smile",
			intensity: 2,
			source: "reply",
		});
	});

	it("logs a mismatch when the topic emotion cannot be mapped", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		dispatchTeacherEmotion(
			encode({ emotion: "wink", source: "reply" }),
			TEACHER_EMOTION_TOPIC,
			vi.fn(),
		);

		expect(warn).toHaveBeenCalledWith("teacher-emotion-mismatch", {
			reason: "unparsed",
			topic: TEACHER_EMOTION_TOPIC,
			raw: { emotion: "wink", source: "reply" },
		});
	});

	it("forwards a valid payload when the topic is missing", () => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
		const onTeacherEmotion = vi.fn();

		dispatchTeacherEmotion(
			encode({ emotion: "thoughtful", source: "reaction" }),
			undefined,
			onTeacherEmotion,
		);

		expect(onTeacherEmotion).toHaveBeenCalledWith({
			emotion: "thoughtful",
			source: "reaction",
		});
	});

	it("ignores other topics and invalid payloads", () => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const onTeacherEmotion = vi.fn();

		dispatchTeacherEmotion(
			encode({ emotion: "smile", source: "reply" }),
			"other",
			onTeacherEmotion,
		);
		dispatchTeacherEmotion(
			encode({ emotion: "wink", source: "reply" }),
			TEACHER_EMOTION_TOPIC,
			onTeacherEmotion,
		);

		expect(onTeacherEmotion).not.toHaveBeenCalled();
	});
});
