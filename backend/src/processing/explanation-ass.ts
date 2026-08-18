export type ExplanationAssInput = {
	phrase: string;
	explanation: string;
	durationSeconds: number;
	width: number;
	height: number;
};

export type AssCue = {
	startSeconds: number;
	endSeconds: number;
	text: string;
};

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

export function buildExplanationCues(
	explanation: string,
	durationSeconds: number,
): AssCue[] {
	const sentences = splitExplanationSentences(explanation);
	if (sentences.length === 0) {
		return [];
	}

	const totalWeight = sentences.reduce(
		(sum, sentence) => sum + Math.max(sentence.length, 1),
		0,
	);
	let cursor = 0;

	return sentences.map((sentence, index) => {
		const weight = Math.max(sentence.length, 1);
		const isLast = index === sentences.length - 1;
		const segmentDuration = isLast
			? durationSeconds - cursor
			: (weight / totalWeight) * durationSeconds;
		const startSeconds = cursor;
		const endSeconds = Math.max(
			startSeconds + 0.05,
			startSeconds + segmentDuration,
		);
		cursor = endSeconds;

		return {
			startSeconds,
			endSeconds: Math.min(endSeconds, durationSeconds),
			text: sentence,
		};
	});
}

export function buildExplanationAss(input: ExplanationAssInput): string {
	const { phrase, explanation, durationSeconds, width, height } = input;
	const titleStyle = `Style: Title,DejaVu Sans,${Math.round(height * 0.06)},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,2,2,10,10,${Math.round(height * 0.18)},1`;
	const bodyStyle = `Style: Body,DejaVu Sans,${Math.round(height * 0.04)},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,${Math.round(height * 0.08)},2`;
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
	const bodyCues = buildExplanationCues(explanation, durationSeconds);
	const bodyDialogues = bodyCues.map(
		(cue) =>
			`Dialogue: 0,${formatAssTimestamp(cue.startSeconds)},${formatAssTimestamp(cue.endSeconds)},Body,,0,0,0,,${escapeAssText(cue.text)}`,
	);

	return `${header}\n${titleDialogue}\n${bodyDialogues.join("\n")}\n`;
}
