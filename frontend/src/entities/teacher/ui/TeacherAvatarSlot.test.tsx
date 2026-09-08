import { render, screen } from "@testing-library/react";

import { TeacherAvatarSlot } from "./TeacherAvatarSlot";

describe("TeacherAvatarSlot", () => {
	it("renders the fallback label when no media is provided", () => {
		render(
			<TeacherAvatarSlot
				size="md"
				status="idle"
				label="AI Teacher Elena"
				fallbackLabel="Elena · AI Instructor"
			/>,
		);

		expect(
			screen.getByRole("region", { name: "AI Teacher Elena" }),
		).toBeInTheDocument();
		expect(screen.getByText("Elena · AI Instructor")).toBeInTheDocument();
	});
});
