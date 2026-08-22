import type { DetectedPhrase } from "../detecting-phrases/phrase-detection.service";
import type {
	WhisperSegment,
	WhisperTranscript,
	WhisperWord,
} from "../shared/merge-transcripts";

export type TranscriptWithSegments = WhisperTranscript;

export type PhraseInsertPoint = {
	index: number;
	phrase: DetectedPhrase;
	insertAtSeconds: number;
	sentenceStartSeconds: number;
};

const SENTENCE_END_PATTERN = /[.?!]$/;
const WORD_GAP_SECONDS = 0.5;

function findSegmentEndForWord(
	segments: WhisperSegment[],
	word: WhisperWord,
): number | null {
	for (const segment of segments) {
		if (word.start >= segment.start && word.end <= segment.end) {
			return segment.end;
		}
	}
	return null;
}

function findSegmentStartForWord(
	segments: WhisperSegment[],
	word: WhisperWord,
): number | null {
	for (const segment of segments) {
		if (word.start >= segment.start && word.end <= segment.end) {
			return segment.start;
		}
	}
	return null;
}

function findSentenceEndByWords(
	words: WhisperWord[],
	endWordIndex: number,
): number {
	const endWord = words[endWordIndex];
	if (!endWord) {
		return 0;
	}

	for (let index = endWordIndex; index < words.length; index += 1) {
		const current = words[index];
		if (SENTENCE_END_PATTERN.test(current.word.trim())) {
			return current.end;
		}

		const next = words[index + 1];
		if (next && next.start - current.end > WORD_GAP_SECONDS) {
			return current.end;
		}
	}

	return words.at(-1)?.end ?? endWord.end;
}

function findSentenceStartByWords(
	words: WhisperWord[],
	startWordIndex: number,
): number {
	const startWord = words[startWordIndex];
	if (!startWord) {
		return 0;
	}

	for (let index = startWordIndex; index >= 0; index -= 1) {
		const current = words[index];
		const previous = words[index - 1];

		if (previous && current.start - previous.end > WORD_GAP_SECONDS) {
			return current.start;
		}

		if (previous && SENTENCE_END_PATTERN.test(previous.word.trim())) {
			return current.start;
		}
	}

	return words[0]?.start ?? startWord.start;
}

function resolveCandidateInsertAtSeconds(
	transcript: TranscriptWithSegments,
	endWordIndex: number,
): number {
	const words = transcript.words ?? [];
	const endWord = words[endWordIndex];
	if (!endWord) {
		return 0;
	}

	const segments = transcript.segments ?? [];
	if (segments.length > 0) {
		const segmentEnd = findSegmentEndForWord(segments, endWord);
		if (segmentEnd !== null) {
			return segmentEnd;
		}
	}

	return findSentenceEndByWords(words, endWordIndex);
}

function resolveCandidateSentenceStartSeconds(
	transcript: TranscriptWithSegments,
	startWordIndex: number,
): number {
	const words = transcript.words ?? [];
	const startWord = words[startWordIndex];
	if (!startWord) {
		return 0;
	}

	const segments = transcript.segments ?? [];
	if (segments.length > 0) {
		const segmentStart = findSegmentStartForWord(segments, startWord);
		if (segmentStart !== null) {
			return segmentStart;
		}
	}

	return findSentenceStartByWords(words, startWordIndex);
}

function snapPastActiveSpeech(input: {
	words: WhisperWord[];
	insertAtSeconds: number;
	maxSeconds?: number;
}): number {
	let insertAt = input.insertAtSeconds;

	while (true) {
		const overlapping = input.words.filter(
			(word) => word.start < insertAt && word.end > insertAt,
		);
		if (overlapping.length === 0) {
			break;
		}

		insertAt = Math.max(...overlapping.map((word) => word.end));
	}

	if (input.maxSeconds !== undefined) {
		return Math.min(insertAt, input.maxSeconds);
	}

	return insertAt;
}

export function resolveSentenceStartSeconds(
	transcript: TranscriptWithSegments,
	startWordIndex: number,
): number {
	return resolveCandidateSentenceStartSeconds(transcript, startWordIndex);
}

export function resolveInsertAtSeconds(
	transcript: TranscriptWithSegments,
	endWordIndex: number,
): number {
	const words = transcript.words ?? [];
	const candidate = resolveCandidateInsertAtSeconds(transcript, endWordIndex);

	return snapPastActiveSpeech({
		words,
		insertAtSeconds: candidate,
		maxSeconds: transcript.duration,
	});
}

export function buildPhraseInsertPoints(
	phrases: DetectedPhrase[],
	transcript: TranscriptWithSegments,
): PhraseInsertPoint[] {
	return phrases.map((phrase, index) => ({
		index,
		phrase,
		insertAtSeconds: resolveInsertAtSeconds(transcript, phrase.endWordIndex),
		sentenceStartSeconds: resolveSentenceStartSeconds(
			transcript,
			phrase.startWordIndex,
		),
	}));
}
