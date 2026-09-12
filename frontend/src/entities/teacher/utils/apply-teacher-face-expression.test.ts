import { applyTeacherFaceExpression } from "./apply-teacher-face-expression";

describe("applyTeacherFaceExpression", () => {
	it("replaces emotion, intensity, and speech while preserving other classes", () => {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute(
			"class",
			"is-static emotion-neutral intensity-1 speech-silent",
		);

		applyTeacherFaceExpression(svg, "laugh", 3, "loud");

		expect(svg.getAttribute("class")).toBe(
			"is-static emotion-laugh intensity-3 speech-loud",
		);
	});

	it("defaults to neutral intensity 1 and silent speech", () => {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("class", "emotion-smile intensity-2 speech-normal");

		applyTeacherFaceExpression(svg);

		expect(svg.getAttribute("class")).toBe(
			"emotion-neutral intensity-1 speech-silent",
		);
	});

	it("keeps speech when only emotion changes", () => {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("class", "emotion-neutral intensity-1 speech-quiet");

		applyTeacherFaceExpression(svg, "smile", 2, "quiet");

		expect(svg.getAttribute("class")).toBe(
			"emotion-smile intensity-2 speech-quiet",
		);
	});
});
