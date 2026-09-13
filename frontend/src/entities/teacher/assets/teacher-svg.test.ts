import { readFileSync } from "node:fs";
import path from "node:path";

describe("teacher avatar SVG", () => {
	it("parses as well-formed SVG XML", () => {
		const svg = readFileSync(path.join(__dirname, "Elena.svg"), "utf8");
		const doc = new DOMParser().parseFromString(svg, "image/svg+xml");

		expect(doc.querySelector("parsererror")).toBeNull();
		expect(doc.documentElement.nodeName).toBe("svg");
	});
});
