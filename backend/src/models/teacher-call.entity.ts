import { Column, Entity, Index, PrimaryColumn } from "typeorm";

import type {
	LanguageLevel,
	TeacherCallRecord,
	TeacherCallStatus,
} from "../storage/types";
import {
	isoDateTransformer,
	nullableIsoDateTransformer,
} from "./utils/iso-date.transformer";

@Entity({ name: "teacher_calls" })
@Index("IDX_teacher_calls_userId_status", ["userId", "status"])
export class TeacherCall implements TeacherCallRecord {
	@PrimaryColumn("uuid")
	id!: string;

	@Column({ type: "varchar" })
	userId!: string;

	@Column({ type: "varchar" })
	roomName!: string;

	@Column({ type: "varchar" })
	status!: TeacherCallStatus;

	@Column({ type: "varchar" })
	sourceLanguage!: string;

	@Column({ type: "varchar" })
	languageLevel!: LanguageLevel;

	@Column({ type: "varchar", nullable: true })
	explanationLanguage!: string | null;

	@Column({ type: "varchar", nullable: true })
	agentDispatchId!: string | null;

	@Column({ type: "text", nullable: true })
	endedReason!: string | null;

	@Column({ type: "timestamptz", transformer: isoDateTransformer })
	createdAt!: string;

	@Column({
		type: "timestamptz",
		nullable: true,
		transformer: nullableIsoDateTransformer,
	})
	endedAt!: string | null;
}
