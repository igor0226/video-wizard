import { type JobContext, defineAgent, llm, voice } from "@livekit/agents";
import * as openai from "@livekit/agents-plugin-openai";
import { z } from "zod";

import {
	buildGreetingInstructions,
	buildTeacherInstructions,
} from "../utils/teacher-instructions";
import {
	EmotionIntensity,
	publishEmotion,
	requireEmotionPublisher,
} from "./emotion";
import { parseTeacherJobMetadata } from "./parse-job-metadata";
import { ReactionController } from "./reaction-controller";

const emotionToolSchema = z.object({
	emotion: z.enum([
		"neutral",
		"smile",
		"laugh",
		"upset",
		"surprised",
		"angry",
		"thoughtful",
	]),
	intensity: z
		.union([
			z.literal(EmotionIntensity.Low),
			z.literal(EmotionIntensity.Medium),
			z.literal(EmotionIntensity.High),
		])
		.optional(),
});

export default defineAgent({
	entry: async (ctx: JobContext) => {
		const metadata = parseTeacherJobMetadata(ctx.job.metadata);
		const instructions = buildTeacherInstructions(metadata);
		const publisher = requireEmotionPublisher(ctx.room.localParticipant);
		const reactions = new ReactionController(publisher);

		const setEmotion = llm.tool({
			description:
				"Set the teacher's visible facial emotion for the current spoken reply.",
			parameters: emotionToolSchema,
			execute: async ({ emotion, intensity }) => {
				await publishEmotion({
					publisher,
					message: { emotion, intensity, source: "reply" },
				});
				return "emotion updated";
			},
		});

		const agent = new voice.Agent({
			instructions,
			tools: { set_emotion: setEmotion },
		});

		const session = new voice.AgentSession({
			llm: new openai.realtime.RealtimeModel({
				model: process.env.SPEAKING_TEACHER_MODEL?.trim() || "gpt-realtime",
				voice: process.env.SPEAKING_TEACHER_VOICE?.trim() || "coral",
				inputAudioTranscription: { model: "gpt-4o-mini-transcribe" },
			}),
		});

		session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (event) => {
			reactions.onTranscript({
				transcript: event.transcript,
				isFinal: event.isFinal,
			});
		});
		session.on(voice.AgentSessionEventTypes.UserStateChanged, (event) => {
			if (event.newState === "speaking") {
				void reactions.onUserStartedSpeaking();
				return;
			}
			if (event.newState === "listening" || event.newState === "away") {
				reactions.onUserStoppedSpeaking();
			}
		});

		await session.start({ agent, room: ctx.room });
		await ctx.connect();
		await session.generateReply({
			instructions: buildGreetingInstructions(metadata),
		});
	},
});
