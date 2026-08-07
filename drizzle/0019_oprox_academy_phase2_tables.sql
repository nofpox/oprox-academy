CREATE TABLE IF NOT EXISTS "acad_lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"completed_at" timestamp,
	"last_position_seconds" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_course_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"enrollment_id" text NOT NULL,
	"course_id" text NOT NULL,
	"completed_lessons_count" integer DEFAULT 0 NOT NULL,
	"total_lessons_count" integer DEFAULT 0 NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"last_lesson_id" text,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_learning_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"activity_type" text DEFAULT 'LESSON_VIEW' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_bookmarks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "acad_lprog_tenant_idx" ON "acad_lesson_progress" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_lprog_user_idx" ON "acad_lesson_progress" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_lprog_enr_idx" ON "acad_lesson_progress" ("enrollment_id");
CREATE INDEX IF NOT EXISTS "acad_lprog_crs_idx" ON "acad_lesson_progress" ("course_id");
CREATE INDEX IF NOT EXISTS "acad_lprog_lsn_idx" ON "acad_lesson_progress" ("lesson_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_lprog_tenant_user_lsn_uniq" ON "acad_lesson_progress" ("tenant_id", "user_id", "lesson_id");

CREATE INDEX IF NOT EXISTS "acad_cprog_tenant_idx" ON "acad_course_progress" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_cprog_user_idx" ON "acad_course_progress" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_cprog_enr_idx" ON "acad_course_progress" ("enrollment_id");
CREATE INDEX IF NOT EXISTS "acad_cprog_crs_idx" ON "acad_course_progress" ("course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_cprog_tenant_user_crs_uniq" ON "acad_course_progress" ("tenant_id", "user_id", "course_id");

CREATE INDEX IF NOT EXISTS "acad_sess_tenant_idx" ON "acad_learning_sessions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_sess_user_idx" ON "acad_learning_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_sess_crs_idx" ON "acad_learning_sessions" ("course_id");

CREATE INDEX IF NOT EXISTS "acad_bm_tenant_idx" ON "acad_bookmarks" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_bm_user_idx" ON "acad_bookmarks" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_bm_tenant_user_lsn_uniq" ON "acad_bookmarks" ("tenant_id", "user_id", "lesson_id");

DO $$ BEGIN
 ALTER TABLE "acad_lesson_progress" ADD CONSTRAINT "acad_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_lesson_progress" ADD CONSTRAINT "acad_lesson_progress_enrollment_id_acad_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "acad_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_lesson_progress" ADD CONSTRAINT "acad_lesson_progress_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_lesson_progress" ADD CONSTRAINT "acad_lesson_progress_lesson_id_acad_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "acad_lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_course_progress" ADD CONSTRAINT "acad_course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_course_progress" ADD CONSTRAINT "acad_course_progress_enrollment_id_acad_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "acad_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_course_progress" ADD CONSTRAINT "acad_course_progress_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_course_progress" ADD CONSTRAINT "acad_course_progress_last_lesson_id_acad_lessons_id_fk" FOREIGN KEY ("last_lesson_id") REFERENCES "acad_lessons"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_learning_sessions" ADD CONSTRAINT "acad_learning_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_learning_sessions" ADD CONSTRAINT "acad_learning_sessions_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_learning_sessions" ADD CONSTRAINT "acad_learning_sessions_lesson_id_acad_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "acad_lessons"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_bookmarks" ADD CONSTRAINT "acad_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_bookmarks" ADD CONSTRAINT "acad_bookmarks_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_bookmarks" ADD CONSTRAINT "acad_bookmarks_lesson_id_acad_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "acad_lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
