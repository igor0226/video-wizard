import type { Video } from "../../models";
import type { VideoRecord } from "../types";

export function sanitizeTitle(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "Untitled video";
	}
	return trimmed.slice(0, 120);
}

export function sanitizeFileName(value: string): string {
	const normalized = value
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^a-zA-Z0-9_.-]/g, "");
	return normalized || "upload.mp4";
}

export function normalizeLegacyVideoRecord(
	parsed: Partial<VideoRecord>,
): VideoRecord {
	return {
		...parsed,
		transcriptRelativePath: parsed.transcriptRelativePath ?? null,
		phrasesRelativePath: parsed.phrasesRelativePath ?? null,
		sourceLanguage: parsed.sourceLanguage ?? "",
		explanationLanguage: parsed.explanationLanguage ?? "",
		languageLevel: parsed.languageLevel ?? "B1",
	} as VideoRecord;
}

export function normalizeVideoRecord(record: Video): VideoRecord {
	return normalizeLegacyVideoRecord(record);
}
