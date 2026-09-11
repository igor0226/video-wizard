import { apiUrl } from "@/shared/api";

export async function endSpeakingCall(input: {
	callId: string;
	userId: string;
}): Promise<void> {
	const response = await fetch(
		apiUrl(`/api/speaking/calls/${input.callId}/end`),
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: input.userId }),
		},
	);
	if (!response.ok) {
		throw new Error(`Failed to end call (${response.status})`);
	}
}
