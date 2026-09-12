import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Headers,
	HttpCode,
	Param,
	Post,
	Query,
	Req,
	UnauthorizedException,
	type RawBodyRequest,
} from "@nestjs/common";
import type { Request } from "express";

import { parseLanguageLevel } from "../videos/utils/parse-language-level";
import { LivekitWebhookService } from "./livekit-webhook.service";
import { SpeakingService } from "./speaking.service";

type CreateCallBody = {
	userId?: unknown;
	sourceLanguage?: unknown;
	languageLevel?: unknown;
	explanationLanguage?: unknown;
	topic?: unknown;
};

@Controller("speaking")
export class SpeakingController {
	constructor(
		private readonly speakingService: SpeakingService,
		private readonly webhookService: LivekitWebhookService,
	) {}

	@Post("calls")
	async createCall(@Body() body: CreateCallBody) {
		const userId = requireNonEmptyString(body.userId, "userId is required");
		const sourceLanguage = requireNonEmptyString(
			body.sourceLanguage,
			"sourceLanguage is required",
		);
		const languageLevel = parseLanguageLevel(
			typeof body.languageLevel === "string" ? body.languageLevel : undefined,
		);
		if (!languageLevel) {
			throw new BadRequestException(
				"languageLevel is required (A1, A2, B1, B2, C1, or C2)",
			);
		}
		const explanationLanguage =
			typeof body.explanationLanguage === "string"
				? body.explanationLanguage.trim()
				: undefined;
		return this.speakingService.createCall({
			userId,
			sourceLanguage,
			languageLevel,
			explanationLanguage,
			topic: parseOptionalTopic(body.topic),
		});
	}

	@Get("calls")
	async listCalls(@Query("userId") userId: string | undefined) {
		return this.speakingService.listCallsForUser(
			requireNonEmptyString(userId, "userId is required"),
		);
	}

	@Get("calls/:id")
	async getCall(
		@Param("id") id: string,
		@Query("userId") userId: string | undefined,
	) {
		return this.speakingService.getCall({
			callId: id,
			userId: requireNonEmptyString(userId, "userId is required"),
		});
	}

	@Post("calls/:id/end")
	@HttpCode(200)
	async endCall(@Param("id") id: string, @Body("userId") userId: unknown) {
		const call = await this.speakingService.endCall({
			callId: id,
			userId: requireNonEmptyString(userId, "userId is required"),
		});
		return { id: call.id, status: call.status };
	}

	@Post("livekit/webhook")
	@HttpCode(200)
	async handleWebhook(
		@Req() req: RawBodyRequest<Request>,
		@Headers("authorization") authorization: string | undefined,
	) {
		const body = req.rawBody?.toString("utf8");
		if (!body) {
			throw new UnauthorizedException("Invalid LiveKit webhook");
		}
		return this.webhookService.handleWebhook({ body, authorization });
	}
}

function requireNonEmptyString(value: unknown, message: string): string {
	if (typeof value !== "string" || !value.trim()) {
		throw new BadRequestException(message);
	}
	return value.trim();
}

function parseOptionalTopic(value: unknown): string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	if (typeof value !== "string" || !value.trim()) {
		throw new BadRequestException("topic must be a non-empty string");
	}
	return value.trim();
}
