import type { LanguageLevel } from "@/shared/config";

import { LANGUAGE_LEVELS } from "@/shared/config";

const CEFR_PATTERN = /\b(A1|A2|B1|B2|C1|C2)\b/i;
const DEFAULT_LEVEL: LanguageLevel = "B1";

export function parseCefrLevel(value: string): LanguageLevel {
	const match = value.match(CEFR_PATTERN);
	if (!match) {
		return DEFAULT_LEVEL;
	}
	const level = match[1].toUpperCase() as LanguageLevel;
	return LANGUAGE_LEVELS.includes(level) ? level : DEFAULT_LEVEL;
}
