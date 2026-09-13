import { logTeacherFaceApplyResult } from "./log-teacher-face-apply";

describe("logTeacherFaceApplyResult", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("does not warn when SVG classes match the expected state", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("class", "emotion-smile intensity-2 speech-quiet");

		logTeacherFaceApplyResult(svg, "smile", 2, "quiet");

		expect(warn).not.toHaveBeenCalled();
	});

	it("warns when the SVG root is missing", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		logTeacherFaceApplyResult(null, "smile", 1, "silent");

		expect(warn).toHaveBeenCalledWith("teacher-emotion-mismatch", {
			reason: "svg-missing",
			expected: { emotion: "smile", intensity: 1, speech: "silent" },
		});
	});
});
