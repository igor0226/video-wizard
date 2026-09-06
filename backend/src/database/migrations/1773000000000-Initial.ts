import type { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1773000000000 implements MigrationInterface {
	name = "Initial1773000000000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "videos" (
				"id" uuid NOT NULL,
				"title" character varying NOT NULL,
				"originalFileName" character varying NOT NULL,
				"mimeType" character varying NOT NULL,
				"sizeBytes" bigint NOT NULL,
				"sourceRelativePath" character varying NOT NULL,
				"dashRelativePath" character varying NOT NULL,
				"manifestFileName" character varying NOT NULL,
				"status" character varying NOT NULL,
				"segmentCount" integer NOT NULL DEFAULT 0,
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
				"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
				"failureReason" text,
				"transcriptRelativePath" character varying,
				"phrasesRelativePath" character varying,
				"sourceLanguage" character varying NOT NULL,
				"explanationLanguage" character varying NOT NULL,
				"languageLevel" character varying NOT NULL,
				CONSTRAINT "PK_videos_id" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`
			CREATE TABLE "processing_history" (
				"videoId" uuid NOT NULL,
				"currentStep" character varying NOT NULL,
				"events" jsonb NOT NULL DEFAULT '[]',
				"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
				CONSTRAINT "PK_processing_history_videoId" PRIMARY KEY ("videoId")
			)
		`);
		await queryRunner.query(`
			CREATE TABLE "processing_locks" (
				"videoId" uuid NOT NULL,
				"acquiredAt" TIMESTAMP WITH TIME ZONE NOT NULL,
				CONSTRAINT "PK_processing_locks_videoId" PRIMARY KEY ("videoId")
			)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "processing_locks"`);
		await queryRunner.query(`DROP TABLE "processing_history"`);
		await queryRunner.query(`DROP TABLE "videos"`);
	}
}
