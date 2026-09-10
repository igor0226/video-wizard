export type LivekitConfig = {
	url: string;
	apiUrl: string;
	apiKey: string;
	apiSecret: string;
	agentName: string;
	tokenTtl: string;
	emptyRoomTimeoutSeconds: number;
};

function requiredEnv(name: string, fallback?: string): string {
	const value = process.env[name]?.trim() || fallback;
	if (!value) {
		throw new Error(`${name} is required`);
	}
	return value;
}

export function toLivekitHttpUrl(url: string): string {
	return url.replace(/^ws/i, "http");
}

export function resolveLivekitConfig(): LivekitConfig {
	const url = requiredEnv("LIVEKIT_URL", "ws://localhost:7880");
	const apiUrl = process.env.LIVEKIT_API_URL?.trim() || toLivekitHttpUrl(url);
	return {
		url,
		apiUrl,
		apiKey: requiredEnv("LIVEKIT_API_KEY"),
		apiSecret: requiredEnv("LIVEKIT_API_SECRET"),
		agentName: process.env.SPEAKING_AGENT_NAME?.trim() || "teacher-agent",
		tokenTtl: process.env.SPEAKING_CALL_TOKEN_TTL?.trim() || "1h",
		emptyRoomTimeoutSeconds: Number(
			process.env.SPEAKING_EMPTY_ROOM_TIMEOUT_SECONDS ?? 60,
		),
	};
}
