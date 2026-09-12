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
});
