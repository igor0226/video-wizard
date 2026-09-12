import type { CreateCallResponse } from "@/entities/speaking-session";

const sessions = new Map<string, Promise<CreateCallResponse>>();

export function getOrCreateCallSession(
	key: string,
	factory: () => Promise<CreateCallResponse>,
): Promise<CreateCallResponse> {
	const existing = sessions.get(key);
	if (existing) {
		return existing;
	}
	const created = factory();
	sessions.set(key, created);
	return created;
}
