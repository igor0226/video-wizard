import { Column, Entity, PrimaryColumn } from "typeorm";

import type {
	ProcessingHistoryEvent,
	ProcessingStep,
	VideoProcessingHistory,
} from "../storage/types";
import { isoDateTransformer } from "./utils/iso-date.transformer";

@Entity({ name: "processing_history" })
export class ProcessingHistory implements VideoProcessingHistory {
	@PrimaryColumn({ type: "uuid", name: "videoId" })
	videoId!: string;

	@Column({ type: "varchar" })
	currentStep!: ProcessingStep;

	@Column({ type: "jsonb", default: [] })
	events!: ProcessingHistoryEvent[];

	@Column({ type: "timestamptz", transformer: isoDateTransformer })
	updatedAt!: string;
}
