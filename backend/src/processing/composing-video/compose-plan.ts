import type { ExplanationClipManifestEntry } from "../generating-clips/explanation-clip.service";

export type CompositionPart =
	| {
			kind: "source";
			startSeconds: number;
			endSeconds: number;
	  }
	| {
			kind: "clip";
			clip: ExplanationClipManifestEntry;
	  };

export function buildCompositionParts(
	clips: ExplanationClipManifestEntry[],
	sourceDurationSeconds: number,
): CompositionPart[] {
	const sortedClips = [...clips].sort((left, right) => {
		if (left.insertAtSeconds !== right.insertAtSeconds) {
			return left.insertAtSeconds - right.insertAtSeconds;
		}
		return left.index - right.index;
	});

	if (sortedClips.length === 0) {
		return [
			{
				kind: "source",
				startSeconds: 0,
				endSeconds: sourceDurationSeconds,
			},
		];
	}

	const uniqueInsertTimes = [
		...new Set(sortedClips.map((clip) => clip.insertAtSeconds)),
	].sort((left, right) => left - right);

	const parts: CompositionPart[] = [];
	let sourceCursor = 0;

	for (const insertAtSeconds of uniqueInsertTimes) {
		if (insertAtSeconds > sourceCursor) {
			parts.push({
				kind: "source",
				startSeconds: sourceCursor,
				endSeconds: insertAtSeconds,
			});
		}

		const clipsAtInsert = sortedClips.filter(
			(clip) => clip.insertAtSeconds === insertAtSeconds,
		);
		for (const clip of clipsAtInsert) {
			parts.push({ kind: "clip", clip });
		}

		sourceCursor = insertAtSeconds;
	}

	if (sourceCursor < sourceDurationSeconds) {
		parts.push({
			kind: "source",
			startSeconds: sourceCursor,
			endSeconds: sourceDurationSeconds,
		});
	}

	return parts;
}
