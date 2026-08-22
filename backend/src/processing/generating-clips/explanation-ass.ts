export type ExplanationAssInput = {
	phrase: string;
	explanation: string;
	durationSeconds: number;
	ttsDurationSeconds: number;
	bodyStartOffsetSeconds: number;
	bodyDurationSeconds: number;
	width: number;
	height: number;
	closingCue?: AssCue;
};

export type AssCue = {
	startSeconds: number;
	endSeconds: number;
	text: string;
};

const TITLE_FONT_SCALE = 0.078;
const BODY_FONT_SCALE = 0.052;
const VERTICAL_MARGIN_SCALE = 0.36;

function escapeAssText(text: string): string {
	return text
		.replace(/\\/g, "\\\\")
		.replace(/\{/g, "\\{")
		.replace(/\}/g, "\\}")
		.replace(/\n/g, "\\N");
}

function formatAssTimestamp(seconds: number): string {
	const totalCentiseconds = Math.max(0, Math.round(seconds * 100));
	const centiseconds = totalCentiseconds % 100;
	const totalSeconds = Math.floor(totalCentiseconds / 100);
	const secs = totalSeconds % 60;
	const totalMinutes = Math.floor(totalSeconds / 60);
	const minutes = totalMinutes % 60;
	const hours = Math.floor(totalMinutes / 60);
	return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function splitExplanationSentences(explanation: string): string[] {
	const trimmed = explanation.trim();
	if (!trimmed) {
		return [];
	}

	const parts = trimmed.match(/[^.!?]+[.!?]?/g);
	if (!parts) {
		return [trimmed];
	}

	return parts.map((part) => part.trim()).filter(Boolean);
}

function buildAssStyles(height: number): {
	titleStyle: string;
	bodyStyle: string;
} {
	const titleFontSize = Math.round(height * TITLE_FONT_SCALE);
	const bodyFontSize = Math.round(height * BODY_FONT_SCALE);
	const marginV = Math.round(height * VERTICAL_MARGIN_SCALE);

	return {
		titleStyle: `Style: Title,DejaVu Sans,${titleFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,2,8,10,10,${marginV},1`,
		bodyStyle: `Style: Body,DejaVu Sans,${bodyFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,${marginV},2`,
	};
}

export function resolveClosingCueTiming(input: {
	clipGapSeconds: number;
	closingGapSeconds: number;
	speechDurationSeconds: number;
	closingDurationSeconds: number;
}): { startSeconds: number; durationSeconds: number } {
	return {
		startSeconds:
			input.clipGapSeconds +
			input.speechDurationSeconds +
			input.closingGapSeconds,
		durationSeconds: input.closingDurationSeconds,
	};
}

export function resolveExplanationBodyTiming(input: {
	phrase: string;
	explanation: string;
	ttsDurationSeconds: number;
	clipGapSeconds: number;
}): { bodyStartOffsetSeconds: number; bodyDurationSeconds: number } {
	const phraseLength = Math.max(input.phrase.trim().length, 0);
	const explanationLength = Math.max(input.explanation.trim().length, 0);
	const totalLength = phraseLength + explanationLength;

	if (totalLength === 0 || input.ttsDurationSeconds <= 0) {
		return {
			bodyStartOffsetSeconds: input.clipGapSeconds,
			bodyDurationSeconds: input.ttsDurationSeconds,
		};
	}

	const phraseShare = phraseLength / totalLength;

	return {
		bodyStartOffsetSeconds:
			input.clipGapSeconds + input.ttsDurationSeconds * phraseShare,
		bodyDurationSeconds: input.ttsDurationSeconds * (1 - phraseShare),
	};
}

export function buildExplanationCues(
	explanation: string,
	durationSeconds: number,
	startOffsetSeconds = 0,
): AssCue[] {
	const sentences = splitExplanationSentences(explanation);
	if (sentences.length === 0) {
		return [];
	}

	const totalWeight = sentences.reduce(
		(sum, sentence) => sum + Math.max(sentence.length, 1),
		0,
	);
	let cursor = startOffsetSeconds;
	const bodyEndSeconds = startOffsetSeconds + durationSeconds;

	return sentences.map((sentence, index) => {
		const weight = Math.max(sentence.length, 1);
		const isLast = index === sentences.length - 1;
		const segmentDuration = isLast
			? bodyEndSeconds - cursor
			: (weight / totalWeight) * durationSeconds;
		const startSeconds = cursor;
		const endSeconds = Math.max(
			startSeconds + 0.05,
			startSeconds + segmentDuration,
		);
		cursor = endSeconds;

		return {
			startSeconds,
			endSeconds: Math.min(endSeconds, bodyEndSeconds),
			text: sentence,
		};
	});
}

export function buildExplanationAss(input: ExplanationAssInput): string {
	const {
		phrase,
		explanation,
		durationSeconds,
		bodyStartOffsetSeconds,
		bodyDurationSeconds,
		width,
		height,
		closingCue,
	} = input;
	const { titleStyle, bodyStyle } = buildAssStyles(height);
	const header = [
		"[Script Info]",
		"ScriptType: v4.00+",
		`PlayResX: ${width}`,
		`PlayResY: ${height}`,
		"WrapStyle: 0",
		"",
		"[V4+ Styles]",
		"Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
		titleStyle,
		bodyStyle,
		"",
		"[Events]",
		"Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
	].join("\n");

	const titleDialogue = `Dialogue: 0,${formatAssTimestamp(0)},${formatAssTimestamp(durationSeconds)},Title,,0,0,0,,${escapeAssText(phrase)}`;
	const bodyCues = buildExplanationCues(
		explanation,
		bodyDurationSeconds,
		bodyStartOffsetSeconds,
	);
	const bodyDialogues = bodyCues.map(
		(cue) =>
			`Dialogue: 0,${formatAssTimestamp(cue.startSeconds)},${formatAssTimestamp(cue.endSeconds)},Body,,0,0,0,,${escapeAssText(cue.text)}`,
	);
	const closingDialogue = closingCue
		? `Dialogue: 0,${formatAssTimestamp(closingCue.startSeconds)},${formatAssTimestamp(closingCue.endSeconds)},Body,,0,0,0,,${escapeAssText(closingCue.text)}`
		: null;

	return `${header}\n${titleDialogue}\n${[...bodyDialogues, closingDialogue].filter(Boolean).join("\n")}\n`;
}

export function getAssStyleMetrics(height: number): {
	titleFontSize: number;
	bodyFontSize: number;
	marginV: number;
} {
	return {
		titleFontSize: Math.round(height * TITLE_FONT_SCALE),
		bodyFontSize: Math.round(height * BODY_FONT_SCALE),
		marginV: Math.round(height * VERTICAL_MARGIN_SCALE),
	};
}
