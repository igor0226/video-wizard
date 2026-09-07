import { render, screen } from "@testing-library/react";

import { AppPageHeader } from "./AppPageHeader";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("AppPageHeader", () => {
	it("renders breadcrumb labels", () => {
		render(
			<AppPageHeader
				breadcrumbs={[{ label: "Tasks", href: "/" }, { label: "Upload" }]}
			/>,
		);

		expect(screen.getByText("Tasks")).toBeInTheDocument();
		expect(screen.getByText("Upload")).toBeInTheDocument();
	});

	it("renders earlier crumbs with href as links", () => {
		render(
			<AppPageHeader
				breadcrumbs={[{ label: "Tasks", href: "/" }, { label: "Upload" }]}
			/>,
		);

		expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("renders the last crumb as plain text", () => {
		render(
			<AppPageHeader
				breadcrumbs={[{ label: "Tasks", href: "/" }, { label: "Upload" }]}
			/>,
		);

		expect(
			screen.queryByRole("link", { name: "Upload" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("Upload")).toBeInTheDocument();
	});
});
