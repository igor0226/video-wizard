import { render, waitFor } from "@testing-library/react";

import { TeacherFace } from "./TeacherFace";

const svgMarkup =
	'<svg id="ai-teacher-face" class="emotion-neutral intensity-1 speech-silent"></svg>';

describe("TeacherFace", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				text: () => Promise.resolve(svgMarkup),
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("adds the static motion class when requested", async () => {
		const { container } = render(<TeacherFace staticMotion />);

		await waitFor(() => {
			expect(container.querySelector("#ai-teacher-face")).toHaveClass(
				"is-static",
			);
		});
	});

	it("keeps the live face class list when motion is enabled", async () => {
		const { container } = render(<TeacherFace />);

		await waitFor(() => {
			expect(container.querySelector("#ai-teacher-face")).not.toHaveClass(
				"is-static",
			);
		});
	});

	it("applies emotion and intensity classes after the SVG loads", async () => {
		const { container } = render(<TeacherFace emotion="laugh" intensity={3} />);

		await waitFor(() => {
			expect(container.querySelector("#ai-teacher-face")).toHaveClass(
				"emotion-laugh",
				"intensity-3",
				"speech-silent",
			);
		});
	});

	it("updates SVG classes when emotion changes without rewriting markup", async () => {
		const { container, rerender } = render(<TeacherFace emotion="neutral" />);

		await waitFor(() => {
			expect(container.querySelector("#ai-teacher-face")).toBeTruthy();
		});
		const svg = container.querySelector("#ai-teacher-face");

		rerender(<TeacherFace emotion="thoughtful" intensity={2} speech="quiet" />);

		expect(svg).toHaveClass(
			"emotion-thoughtful",
			"intensity-2",
			"speech-quiet",
		);
		expect(svg).toBe(container.querySelector("#ai-teacher-face"));
	});

	it("applies speech-loud after the SVG loads", async () => {
		const { container } = render(<TeacherFace speech="loud" />);

		await waitFor(() => {
			expect(container.querySelector("#ai-teacher-face")).toHaveClass(
				"speech-loud",
			);
		});
	});
});
