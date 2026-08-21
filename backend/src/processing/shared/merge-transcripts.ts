export type WhisperWord = {
	word: string;
	start: number;
	end: number;
};

export type WhisperSegment = {
	id?: number;
	seek?: number;
	start: number;
	end: number;
	text: string;
};

export type WhisperTranscript = {
	language: string;
	duration: number;
	text: string;
	words: WhisperWord[];
	segments?: WhisperSegment[];
};

export function mergeWhisperTranscripts(
	chunks: WhisperTranscript[],
	chunkOffsetsSeconds: number[],
): WhisperTranscript {
	if (chunks.length === 0) {
		throw new Error("Cannot merge empty transcript chunks");
	}

	const first = chunks[0];
	const mergedWords: WhisperWord[] = [];
	const mergedSegments: WhisperSegment[] = [];
	const textParts: string[] = [];
	let totalDuration = 0;

	for (let index = 0; index < chunks.length; index += 1) {
		const chunk = chunks[index];
		const offset = chunkOffsetsSeconds[index] ?? 0;
		const trimmedText = chunk.text.trim();
		if (trimmedText) {
			textParts.push(trimmedText);
		}

		for (const word of chunk.words ?? []) {
			mergedWords.push({
				word: word.word,
				start: word.start + offset,
				end: word.end + offset,
			});
		}

		for (const segment of chunk.segments ?? []) {
			mergedSegments.push({
				...segment,
				start: segment.start + offset,
				end: segment.end + offset,
			});
		}

		totalDuration = Math.max(totalDuration, offset + chunk.duration);
	}

	return {
		language: first.language,
		duration: totalDuration,
		text: textParts.join(" ").trim(),
		words: mergedWords,
		segments: mergedSegments.length > 0 ? mergedSegments : undefined,
	};
}
