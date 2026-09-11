import { getAnonymousUserId } from "./anonymous-user-id";

const STORAGE_KEY = "llp.anonymous-user-id";

describe("getAnonymousUserId", () => {
	afterEach(() => {
		window.localStorage.removeItem(STORAGE_KEY);
	});

	it("persists a generated id in localStorage", () => {
		const first = getAnonymousUserId();
		expect(first).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
		expect(window.localStorage.getItem(STORAGE_KEY)).toBe(first);
		expect(getAnonymousUserId()).toBe(first);
	});

	it("returns the stored id when one already exists", () => {
		window.localStorage.setItem(STORAGE_KEY, "user-from-storage");
		expect(getAnonymousUserId()).toBe("user-from-storage");
	});
});
