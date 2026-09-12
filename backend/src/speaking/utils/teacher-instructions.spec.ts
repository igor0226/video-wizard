import { describe, expect, it } from "vitest";

import {
	buildGreetingInstructions,
	buildTeacherInstructions,
} from "./teacher-instructions";

describe("teacher instructions", () => {
	it("keeps generic instructions when topic is missing", () => {
		const instructions = buildTeacherInstructions({
			sourceLanguage: "English",
			languageLevel: "B1",
		});
		expect(instructions).toContain("practicing English at CEFR level B1");
		expect(instructions).not.toContain("practice scenario");
		expect(
			buildGreetingInstructions({
				sourceLanguage: "English",
				languageLevel: "B1",
			}),
		).toContain("invite them to start speaking");
	});

	it("mixes the topic into system and greeting instructions", () => {
		const input = {
			sourceLanguage: "English",
			languageLevel: "B2" as const,
			topic: "Job Interview: Technical communication",
		};
		expect(buildTeacherInstructions(input)).toContain(
			"The practice scenario is: Job Interview: Technical communication.",
		);
		expect(buildGreetingInstructions(input)).toContain(
			"open the session on this scenario: Job Interview: Technical communication",
		);
	});
});
