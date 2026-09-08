import { focusAdjacentButton } from "./focus-adjacent";

describe("focusAdjacentButton", () => {
	it("focuses the next sibling button", () => {
		const parent = document.createElement("div");
		const first = document.createElement("button");
		const second = document.createElement("button");
		parent.append(first, second);
		document.body.append(parent);
		first.focus();

		focusAdjacentButton(first, "next");

		expect(document.activeElement).toBe(second);
		parent.remove();
	});
});
