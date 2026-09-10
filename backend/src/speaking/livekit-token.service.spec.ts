import { describe, expect, it } from "vitest";

import { LivekitTokenService } from "./livekit-token.service";

describe("LivekitTokenService", () => {
	it("creates a JWT for the participant identity and room", async () => {
		const service = new LivekitTokenService();
		const token = await service.createParticipantToken({
			identity: "user-1",
			roomName: "teacher-room",
		});
		expect(token.split(".")).toHaveLength(3);
	});
});
