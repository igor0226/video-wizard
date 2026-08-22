import { describe, expect, it } from "vitest";

import { getListenAgainPhrase } from "./listen-again";

describe("getListenAgainPhrase", () => {
	it("returns the English phrase by default", () => {
		expect(getListenAgainPhrase("English")).toBe("Let's listen once again!");
	});

	it("returns a localized phrase for known languages", () => {
		expect(getListenAgainPhrase("Spanish")).toBe("¡Escuchemos una vez más!");
		expect(getListenAgainPhrase("fr")).toBe("Écoutons encore une fois !");
	});

	it("falls back to English for unknown languages", () => {
		expect(getListenAgainPhrase("Klingon")).toBe("Let's listen once again!");
	});
});
