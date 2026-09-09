import { z } from "zod";

import type { LanguageLevel } from "../../storage/types";

const JobMetadataSchema = z.object({
	callId: z.string(),
	sourceLanguage: z.string(),
	languageLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
	explanationLanguage: z.string().nullable().optional(),
});

export type TeacherJobMetadata = {
	callId: string;
	sourceLanguage: string;
	languageLevel: LanguageLevel;
	explanationLanguage?: string | null;
};

export function parseTeacherJobMetadata(
	raw: string | undefined,
): TeacherJobMetadata {
	if (!raw?.trim()) {
		return {
			callId: "unknown",
			sourceLanguage: "English",
			languageLevel: "B1",
		};
	}
	const parsed = JobMetadataSchema.safeParse(JSON.parse(raw));
	if (!parsed.success) {
		return {
			callId: "unknown",
			sourceLanguage: "English",
			languageLevel: "B1",
		};
	}
	return parsed.data;
}
