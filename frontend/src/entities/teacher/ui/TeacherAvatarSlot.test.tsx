import { render, screen } from "@testing-library/react";

import { TeacherAvatarSlot } from "./TeacherAvatarSlot";

describe("TeacherAvatarSlot", () => {
	it("renders the labeled slot when no media is provided", () => {
		render(
			<TeacherAvatarSlot size="md" status="idle" label="AI Teacher Elena" />,
		);

		expect(
			screen.getByRole("region", { name: "AI Teacher Elena" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("img")).not.toBeInTheDocument();
	});

	it("renders provided image media", () => {
		render(
			<TeacherAvatarSlot
				size="lg"
				status="idle"
				media={{ type: "image", src: "/elena.svg", alt: "AI Teacher Elena" }}
			/>,
		);

		expect(
			screen.getByRole("img", { name: "AI Teacher Elena" }),
		).toHaveAttribute("src", "/elena.svg");
	});
});
