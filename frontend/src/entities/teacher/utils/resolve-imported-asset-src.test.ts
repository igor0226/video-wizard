import { resolveImportedAssetSrc } from "./resolve-imported-asset-src";

describe("resolveImportedAssetSrc", () => {
	it("returns a string import as-is", () => {
		expect(resolveImportedAssetSrc("/elena.svg")).toBe("/elena.svg");
	});

	it("reads src from a Next.js static image import", () => {
		expect(resolveImportedAssetSrc({ src: "/_next/static/elena.svg" })).toBe(
			"/_next/static/elena.svg",
		);
	});
});
