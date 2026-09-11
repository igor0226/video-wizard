const STORAGE_KEY = "llp.anonymous-user-id";

export function getAnonymousUserId(): string {
	const existing = window.localStorage.getItem(STORAGE_KEY)?.trim();
	if (existing) {
		return existing;
	}
	const id = crypto.randomUUID();
	window.localStorage.setItem(STORAGE_KEY, id);
	return id;
}
