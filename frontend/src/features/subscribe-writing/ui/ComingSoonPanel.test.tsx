import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ComingSoonPanel } from "./ComingSoonPanel";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("ComingSoonPanel", () => {
	it("shows a validation error for an invalid email", async () => {
		const user = userEvent.setup();
		render(<ComingSoonPanel />);

		await user.type(
			screen.getByPlaceholderText(/early access/i),
			"not-an-email",
		);
		await user.click(screen.getByRole("button", { name: "Notify Me" }));

		expect(
			screen.getByText("Please enter a valid email address"),
		).toBeInTheDocument();
	});

	it("links back to listening", () => {
		render(<ComingSoonPanel />);
		expect(
			screen.getByRole("link", { name: "Return to Listening" }),
		).toHaveAttribute("href", "/listening");
	});
});
