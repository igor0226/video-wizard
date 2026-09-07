import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "./button";

describe("Button", () => {
	it("renders its label", () => {
		render(<Button>Save</Button>);
		expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
	});

	it("applies variant and size classes", () => {
		render(
			<Button variant="destructive" size="sm">
				Delete
			</Button>,
		);

		const button = screen.getByRole("button", { name: "Delete" });
		expect(button.className).toContain("bg-destructive");
		expect(button.className).toContain("h-8");
	});

	it("renders asChild as an anchor", () => {
		render(
			<Button asChild>
				<a href="/tasks">Tasks</a>
			</Button>,
		);

		expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute(
			"href",
			"/tasks",
		);
	});

	it("forwards click handlers", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();

		render(<Button onClick={onClick}>Click me</Button>);
		await user.click(screen.getByRole("button", { name: "Click me" }));

		expect(onClick).toHaveBeenCalledOnce();
	});
});
