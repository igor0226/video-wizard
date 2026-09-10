import { WorkerOptions, cli } from "@livekit/agents";
import { fileURLToPath } from "node:url";

cli.runApp(
	new WorkerOptions({
		agent: fileURLToPath(new URL("./teacher-agent.ts", import.meta.url)),
		agentName: process.env.SPEAKING_AGENT_NAME?.trim() || "teacher-agent",
	}),
);
