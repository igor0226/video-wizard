import { Column, Entity, PrimaryColumn } from "typeorm";

import type {
	LanguageLevel,
	VideoProcessingStatus,
	VideoRecord,
} from "../storage/types";
import {
	bigintTransformer,
	isoDateTransformer,
} from "./utils/iso-date.transformer";

@Entity({ name: "videos" })
export class Video implements VideoRecord {
	@PrimaryColumn("uuid")
	id!: string;

	@Column({ type: "varchar" })
	title!: string;

	@Column({ type: "varchar" })
	originalFileName!: string;

	@Column({ type: "varchar" })
	mimeType!: string;

	@Column({ type: "bigint", transformer: bigintTransformer })
	sizeBytes!: number;

	@Column({ type: "varchar" })
	sourceRelativePath!: string;

	@Column({ type: "varchar" })
	dashRelativePath!: string;

	@Column({ type: "varchar" })
	manifestFileName!: string;

	@Column({ type: "varchar" })
	status!: VideoProcessingStatus;

	@Column({ type: "int", default: 0 })
	segmentCount!: number;

	@Column({ type: "timestamptz", transformer: isoDateTransformer })
	createdAt!: string;

	@Column({ type: "timestamptz", transformer: isoDateTransformer })
	updatedAt!: string;

	@Column({ type: "text", nullable: true })
	failureReason!: string | null;

	@Column({ type: "varchar", nullable: true })
	transcriptRelativePath!: string | null;

	@Column({ type: "varchar", nullable: true })
	phrasesRelativePath!: string | null;

	@Column({ type: "varchar" })
	sourceLanguage!: string;

	@Column({ type: "varchar" })
	explanationLanguage!: string;

	@Column({ type: "varchar" })
	languageLevel!: LanguageLevel;
}
