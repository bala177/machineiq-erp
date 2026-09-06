import { MigrationInterface, QueryRunner } from 'typeorm';

export class FeedbackSystem2026090600001 implements MigrationInterface {
  name = 'FeedbackSystem2026090600001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "feedback" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" varchar(24) NOT NULL,
        "urgency" varchar(20) NOT NULL DEFAULT 'important',
        "status" varchar(20) NOT NULL DEFAULT 'new',
        "message" text NOT NULL,
        "contact_allowed" boolean NOT NULL DEFAULT true,
        "page_path" varchar(500) NOT NULL,
        "page_title" varchar(200),
        "app_version" varchar(40),
        "git_commit" varchar(80),
        "browser" varchar(500),
        "device_type" varchar(20),
        "viewport_width" integer,
        "viewport_height" integer,
        "timezone" varchar(80),
        "recent_api_error" jsonb,
        "screenshot_data_url" text,
        "customer_response" text,
        "internal_notes" text,
        "assignee_id" uuid,
        "target_release" varchar(80),
        "duplicate_of_id" uuid,
        "resolved_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "PK_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_feedback_type" CHECK ("type" IN ('broken','hard_to_use','suggestion','general','positive')),
        CONSTRAINT "CHK_feedback_urgency" CHECK ("urgency" IN ('blocking','important','minor')),
        CONSTRAINT "CHK_feedback_status" CHECK ("status" IN ('new','reviewing','needs_info','planned','fixed','wont_fix','closed')),
        CONSTRAINT "FK_feedback_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_feedback_assignee" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_feedback_duplicate" FOREIGN KEY ("duplicate_of_id") REFERENCES "feedback"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_status_created" ON "feedback" ("status", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_user_created" ON "feedback" ("user_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_feedback_urgency" ON "feedback" ("urgency")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feedback"`);
  }
}
