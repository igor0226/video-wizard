export function isInvalidUuidError(error: unknown): boolean {
	return (error as { code?: string }).code === "22P02";
}

export function isUniqueViolation(error: unknown): boolean {
	return (error as { code?: string }).code === "23505";
}
