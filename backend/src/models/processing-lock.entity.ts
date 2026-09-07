import { Column, Entity, PrimaryColumn } from "typeorm";

import { isoDateTransformer } from "./utils/iso-date.transformer";

@Entity({ name: "processing_locks" })
export class ProcessingLock {
	@PrimaryColumn({ type: "uuid", name: "videoId" })
	videoId!: string;

	@Column({ type: "timestamptz", transformer: isoDateTransformer })
	acquiredAt!: string;
}
