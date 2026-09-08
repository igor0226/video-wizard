import type { SavedPhrase } from "@/entities/speaking-session";

export function saveCallPhrase(
	term: string,
	sessionSeconds: number,
	existing: SavedPhrase[],
): { phrases: SavedPhrase[]; input: string } | null {
	const trimmed = term.trim();
	if (!trimmed) {
		return null;
	}
	const duplicate = existing.find(
		(phrase) => phrase.term.toLowerCase() === trimmed.toLowerCase(),
	);
	if (duplicate) {
		return { phrases: existing, input: "" };
	}
	const minutes = Math.floor(sessionSeconds / 60)
		.toString()
		.padStart(2, "0");
	const seconds = Math.floor(sessionSeconds % 60)
		.toString()
		.padStart(2, "0");
	return {
		input: "",
		phrases: [
			{
				id: `p-${Date.now()}`,
				term: trimmed,
				phonetic: "/.../",
				cefr: "B2",
				definition: "Contextual vocabulary captured during live AI discussion.",
				savedAt: `${minutes}:${seconds}`,
			},
			...existing,
		],
	};
}
