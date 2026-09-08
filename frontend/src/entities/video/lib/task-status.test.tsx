import {
	getProcessingEventStatusLabel,
	getProcessingStepLabel,
	getTaskStatusLabel,
} from "./task-status";

describe("getTaskStatusLabel", () => {
	it("maps ready to Completed", () => {
		expect(getTaskStatusLabel("ready")).toBe("Completed");
	});

	it("maps failed to Failed", () => {
		expect(getTaskStatusLabel("failed")).toBe("Failed");
	});

	it("maps pending to Queued and processing to Processing", () => {
		expect(getTaskStatusLabel("pending")).toBe("Queued");
		expect(getTaskStatusLabel("processing")).toBe("Processing");
	});
});

describe("getProcessingStepLabel", () => {
	it("returns human-readable step labels", () => {
		expect(getProcessingStepLabel("transcribing")).toBe("Transcribing");
		expect(getProcessingStepLabel("dash_encoding")).toBe("Encoding DASH");
	});
});

describe("getProcessingEventStatusLabel", () => {
	it("returns human-readable event status labels", () => {
		expect(getProcessingEventStatusLabel("started")).toBe("Started");
		expect(getProcessingEventStatusLabel("completed")).toBe("Completed");
		expect(getProcessingEventStatusLabel("failed")).toBe("Failed");
	});
});
