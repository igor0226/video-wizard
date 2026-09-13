export function resolveImportedAssetSrc(
	imported: string | { src: string },
): string {
	return typeof imported === "string" ? imported : imported.src;
}
