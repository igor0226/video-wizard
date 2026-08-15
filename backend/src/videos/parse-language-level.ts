import type { LanguageLevel } from "../storage/types";

const VALID_LEVELS = new Set<LanguageLevel>([
	"A1",
	"A2",
	"B1",
	"B2",
	"C1",
	"C2",
]);

export function parseLanguageLevel(
	value: string | undefined,
): LanguageLevel | null {
	if (typeof value !== "string") {
		return null;
	}
	const normalized = value.trim().toUpperCase();
	if (!VALID_LEVELS.has(normalized as LanguageLevel)) {
		return null;
	}
	return normalized as LanguageLevel;
}
