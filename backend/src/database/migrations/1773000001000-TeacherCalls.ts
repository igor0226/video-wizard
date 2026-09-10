import type { MigrationInterface, QueryRunner } from "typeorm";

export class TeacherCalls1773000001000 implements MigrationInterface {
	name = "TeacherCalls1773000001000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "teacher_calls" (
				"id" uuid NOT NULL,
				"userId" character varying NOT NULL,
				"roomName" character varying NOT NULL,
				"status" character varying NOT NULL,
				"sourceLanguage" character varying NOT NULL,
				"languageLevel" character varying NOT NULL,
				"explanationLanguage" character varying,
				"agentDispatchId" character varying,
				"endedReason" text,
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
				"endedAt" TIMESTAMP WITH TIME ZONE,
				CONSTRAINT "PK_teacher_calls_id" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`
			CREATE INDEX "IDX_teacher_calls_userId_status"
			ON "teacher_calls" ("userId", "status")
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_teacher_calls_userId_status"`);
		await queryRunner.query(`DROP TABLE "teacher_calls"`);
	}
}
