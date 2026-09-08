import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TasksTablePagination } from "./TasksTablePagination";

describe("TasksTablePagination", () => {
	it("shows the current page label", () => {
		render(
			<TasksTablePagination
				totalRows={25}
				selectedCount={0}
				pageIndex={0}
				pageSize={10}
				onPageIndexChange={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
	});

	it("disables previous and first buttons on the first page", () => {
		render(
			<TasksTablePagination
				totalRows={25}
				selectedCount={0}
				pageIndex={0}
				pageSize={10}
				onPageIndexChange={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
		expect(
			screen.getByRole("button", { name: "Previous page" }),
		).toBeDisabled();
	});

	it("calls onPageIndexChange when Next is clicked", async () => {
		const user = userEvent.setup();
		const onPageIndexChange = vi.fn();

		render(
			<TasksTablePagination
				totalRows={25}
				selectedCount={0}
				pageIndex={0}
				pageSize={10}
				onPageIndexChange={onPageIndexChange}
				onPageSizeChange={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Next page" }));

		expect(onPageIndexChange).toHaveBeenCalledWith(1);
	});
});
