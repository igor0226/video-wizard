import { writeFile } from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, type PinoLogger } from "nestjs-pino";
import OpenAI from "openai";

import { BlobStorageService } from "../../storage";
import { probeAudioDurationSeconds } from "../shared/ffmpeg-probe";
import type { MediaWorkspace } from "../shared/media-workspace.service";
import { MediaWorkspaceService } from "../shared/media-workspace.service";
import {
	getListenAgainPhrase,
	normalizeExplanationLanguage,
} from "./listen-again";

const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "coral";
const SENTENCE_END_PATTERN = /[.!?]$/;

export type SynthesizeSpeechInput = {
	phrase: string;
	explanation: string;
	explanationLanguage: string;
	outputRelativePath: string;
	workspace?: MediaWorkspace;
};

export function buildExplanationSpeechText(input: {
	phrase: string;
	explanation: string;
}): string {
	const phrase = input.phrase.trim();
	const explanation = input.explanation.trim();

	if (!phrase) {
		return explanation;
	}

	if (!explanation) {
		return phrase;
	}

	const separator = SENTENCE_END_PATTERN.test(phrase) ? " " : ". ";
	return `${phrase}${separator}${explanation}`;
}

@Injectable()
export class ExplanationTtsService {
	private openaiClient: OpenAI | null = null;

	constructor(
		@InjectPinoLogger(ExplanationTtsService.name)
		private readonly logger: PinoLogger,
		private readonly blobStorage: BlobStorageService,
		private readonly mediaWorkspace: MediaWorkspaceService,
	) {}

	async synthesizeSpeech(
		input: SynthesizeSpeechInput,
	): Promise<{ durationSeconds: number }> {
		const apiKey = process.env.OPENAI_API_KEY?.trim();
		if (!apiKey) {
			throw new Error("OPENAI_API_KEY is required for explanation TTS");
		}

		const client = this.getOpenAiClient(apiKey);
		this.logger.info(
			{ output: input.outputRelativePath },
			"explanation-tts-start",
		);

		const response = await client.audio.speech.create({
			model: TTS_MODEL,
			voice: TTS_VOICE,
			input: buildExplanationSpeechText({
				phrase: input.phrase,
				explanation: input.explanation,
			}),
			instructions: `Speak clearly as a language teacher in ${input.explanationLanguage}. Keep a calm, helpful tone.`,
		});

		const buffer = Buffer.from(await response.arrayBuffer());
		const ownsWorkspace = !input.workspace;
		const workspace =
			input.workspace ?? (await this.mediaWorkspace.create("explanation-tts"));

		try {
			const localPath = await workspace.localPath(
				path.basename(input.outputRelativePath),
			);
			await writeFile(localPath, buffer);
			const durationSeconds = await probeAudioDurationSeconds(localPath);
			await workspace.upload({
				localPath,
				key: input.outputRelativePath,
			});
			this.logger.info(
				{ output: input.outputRelativePath, durationSeconds },
				"explanation-tts-success",
			);
			return { durationSeconds };
		} finally {
			if (ownsWorkspace) {
				await workspace.dispose();
			}
		}
	}

	async resolveClosingAudio(input: {
		explanationLanguage: string;
		workspace: MediaWorkspace;
	}): Promise<{ absolutePath: string; durationSeconds: number }> {
		const normalizedLanguage = normalizeExplanationLanguage(
			input.explanationLanguage,
		);
		const assetRelativePath =
			this.blobStorage.getListenAgainAssetRelativePath(normalizedLanguage);

		if (!(await this.blobStorage.fileExists(assetRelativePath))) {
			this.logger.info(
				{ language: normalizedLanguage, output: assetRelativePath },
				"explanation-tts-closing-cache-miss",
			);
			await this.synthesizeSpeech({
				phrase: "",
				explanation: getListenAgainPhrase(input.explanationLanguage),
				explanationLanguage: input.explanationLanguage,
				outputRelativePath: assetRelativePath,
				workspace: input.workspace,
			});
		} else {
			this.logger.info(
				{ language: normalizedLanguage, output: assetRelativePath },
				"explanation-tts-closing-cache-hit",
			);
		}

		const absolutePath = await input.workspace.download({
			key: assetRelativePath,
			relative: path.basename(assetRelativePath),
		});
		const durationSeconds = await probeAudioDurationSeconds(absolutePath);
		return { absolutePath, durationSeconds };
	}

	private getOpenAiClient(apiKey: string): OpenAI {
		if (!this.openaiClient) {
			this.openaiClient = new OpenAI({ apiKey });
		}
		return this.openaiClient;
	}
}

export function formatClipIndex(index: number): string {
	return String(index).padStart(3, "0");
}

export function getClipSpeechAudioRelativePath(
	videoId: string,
	index: number,
): string {
	return path.posix.join(
		"explanations",
		videoId,
		"clips",
		`${formatClipIndex(index)}.speech.mp3`,
	);
}

export function getClipAudioRelativePath(
	videoId: string,
	index: number,
): string {
	return path.posix.join(
		"explanations",
		videoId,
		"clips",
		`${formatClipIndex(index)}.mp3`,
	);
}

export function getClipVideoRelativePath(
	videoId: string,
	index: number,
): string {
	return path.posix.join(
		"explanations",
		videoId,
		"clips",
		`${formatClipIndex(index)}.mp4`,
	);
}

export function getClipAssRelativePath(videoId: string, index: number): string {
	return path.posix.join(
		"explanations",
		videoId,
		"clips",
		`${formatClipIndex(index)}.ass`,
	);
}
