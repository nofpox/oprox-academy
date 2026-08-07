CREATE TABLE IF NOT EXISTS "acad_lab_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"lab_type" text NOT NULL,
	"code_project_id" text,
	"studio_project_id" text,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"checkpoints_json" text DEFAULT '[]' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"feedback" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "acad_lab_sess_tenant_idx" ON "acad_lab_sessions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_lab_sess_user_idx" ON "acad_lab_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_lab_sess_course_idx" ON "acad_lab_sessions" ("course_id");
CREATE INDEX IF NOT EXISTS "acad_lab_sess_lesson_idx" ON "acad_lab_sessions" ("lesson_id");

DO $$ BEGIN
 ALTER TABLE "acad_lab_sessions" ADD CONSTRAINT "acad_lab_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_lab_sessions" ADD CONSTRAINT "acad_lab_sessions_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
