import type { CallHistoryItem, SpeakingCall } from "../model/types";

import { apiUrl } from "@/shared/api";
import { isRecord } from "@/shared/lib";
import { mapCallHistoryItem } from "../utils/map-call-history-item";

export async function fetchSpeakingCalls(
	userId: string,
): Promise<SpeakingCall[]> {
	const response = await fetch(
		apiUrl(`/api/speaking/calls?userId=${encodeURIComponent(userId)}`),
	);
	if (!response.ok) {
		throw new Error("Failed to load speaking sessions");
	}
	return parseCallHistory(await response.json());
}

function parseCallHistory(value: unknown): SpeakingCall[] {
	if (!Array.isArray(value)) {
		throw new Error("Invalid speaking history response");
	}
	return value.map(parseCallHistoryItem).map(mapCallHistoryItem);
}

function parseCallHistoryItem(value: unknown): CallHistoryItem {
	if (!isRecord(value)) {
		throw new Error("Invalid speaking history item");
	}
	const durationSeconds =
		value.durationSeconds === null
			? null
			: readFiniteNumber(value, "durationSeconds");
	return {
		id: readString(value, "id"),
		status: readHistoryStatus(value.status),
		sourceLanguage: readString(value, "sourceLanguage"),
		languageLevel: readLanguageLevel(value.languageLevel),
		explanationLanguage:
			value.explanationLanguage === null
				? null
				: readString(value, "explanationLanguage"),
		createdAt: readString(value, "createdAt"),
		endedAt: value.endedAt === null ? null : readString(value, "endedAt"),
		durationSeconds,
	};
}

function readString(value: Record<string, unknown>, key: string): string {
	const field = value[key];
	if (typeof field !== "string" || !field.trim()) {
		throw new Error(`Invalid speaking history item: ${key}`);
	}
	return field;
}

function readFiniteNumber(value: Record<string, unknown>, key: string): number {
	const field = value[key];
	if (typeof field !== "number" || !Number.isFinite(field)) {
		throw new Error(`Invalid speaking history item: ${key}`);
	}
	return field;
}

function readHistoryStatus(value: unknown): CallHistoryItem["status"] {
	if (value === "active" || value === "ended" || value === "failed") {
		return value;
	}
	throw new Error("Invalid speaking history item: status");
}

function readLanguageLevel(value: unknown): CallHistoryItem["languageLevel"] {
	if (
		value === "A1" ||
		value === "A2" ||
		value === "B1" ||
		value === "B2" ||
		value === "C1" ||
		value === "C2"
	) {
		return value;
	}
	throw new Error("Invalid speaking history item: languageLevel");
}
