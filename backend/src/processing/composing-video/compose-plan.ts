import type { ExplanationClipManifestEntry } from "../generating-clips/explanation-clip.service";

export type PlaybackPhrase = {
	index: number;
	phrase: string;
	explanation: string;
	startSeconds: number;
	endSeconds: number;
};

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

export function buildExplanationsByIndex(
	phrases: Array<{ explanation: string }>,
): Map<number, string> {
	const explanationsByIndex = new Map<number, string>();
	for (let index = 0; index < phrases.length; index += 1) {
		explanationsByIndex.set(index, phrases[index].explanation);
	}
	return explanationsByIndex;
}

export function buildPlaybackPhrases(input: {
	parts: CompositionPart[];
	explanationsByIndex: ReadonlyMap<number, string>;
}): PlaybackPhrase[] {
	const playbackPhrases: PlaybackPhrase[] = [];
	let enrichedCursor = 0;

	for (const part of input.parts) {
		if (part.kind === "source") {
			enrichedCursor += part.endSeconds - part.startSeconds;
			continue;
		}

		const { clip } = part;
		const startSeconds = enrichedCursor;
		const endSeconds = enrichedCursor + clip.durationSeconds;
		playbackPhrases.push({
			index: clip.index,
			phrase: clip.phrase,
			explanation: input.explanationsByIndex.get(clip.index) ?? "",
			startSeconds,
			endSeconds,
		});
		enrichedCursor = endSeconds;
	}

	return playbackPhrases;
}
