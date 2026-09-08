export type LanguageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const LANGUAGE_OPTIONS = [
	"English",
	"Spanish",
	"French",
	"German",
	"Italian",
	"Portuguese",
	"Russian",
	"Chinese",
	"Mandarin",
	"Japanese",
	"Korean",
	"Arabic",
] as const;

export const LANGUAGE_LEVELS: LanguageLevel[] = [
	"A1",
	"A2",
	"B1",
	"B2",
	"C1",
	"C2",
];
