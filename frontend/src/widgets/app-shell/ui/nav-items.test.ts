import { isNavItemActive } from "./nav-items";

describe("isNavItemActive", () => {
	it("matches dashboard exactly", () => {
		expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
		expect(isNavItemActive("/listening", "/dashboard")).toBe(false);
	});

	it("matches nested listening and speaking routes", () => {
		expect(isNavItemActive("/listening/upload", "/listening")).toBe(true);
		expect(isNavItemActive("/speaking/call/1", "/speaking")).toBe(true);
		expect(isNavItemActive("/writing", "/speaking")).toBe(false);
	});
});
