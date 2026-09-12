import { withSvgRootClass } from "./with-svg-root-class";

describe("withSvgRootClass", () => {
	it("prepends a class on the root svg", () => {
		const markup =
			'<svg class="emotion-neutral speech-silent" viewBox="0 0 1 1"></svg>';

		expect(withSvgRootClass(markup, "is-static")).toContain(
			'class="is-static emotion-neutral speech-silent"',
		);
	});
});
