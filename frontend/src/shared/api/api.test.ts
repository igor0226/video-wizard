import { apiUrl } from "./api";

describe("apiUrl", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("uses the default base URL when env is unset", () => {
		vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
		expect(apiUrl("/api/videos")).toBe("http://localhost:3001/api/videos");
	});

	it("respects NEXT_PUBLIC_API_URL override", () => {
		vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
		expect(apiUrl("/api/videos")).toBe("https://api.example.com/api/videos");
	});

	it("normalizes trailing and missing slashes", () => {
		vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com/");
		expect(apiUrl("api/videos")).toBe("https://api.example.com/api/videos");
	});
});
