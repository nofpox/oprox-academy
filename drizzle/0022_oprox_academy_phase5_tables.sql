CREATE TABLE IF NOT EXISTS "acad_tutor_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_tutor_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"grounding_context" text,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_learner_mastery" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"concept_key" text NOT NULL,
	"mastery_score" integer DEFAULT 0 NOT NULL,
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"correct_attempts" integer DEFAULT 0 NOT NULL,
	"last_evaluated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_adaptive_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"recommendation_type" text NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"lesson_id" text,
	"target_concept" text,
	"priority" integer DEFAULT 1 NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "acad_tut_sess_tenant_idx" ON "acad_tutor_sessions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_tut_sess_user_idx" ON "acad_tutor_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_tut_sess_course_idx" ON "acad_tutor_sessions" ("course_id");

CREATE INDEX IF NOT EXISTS "acad_tut_msg_tenant_idx" ON "acad_tutor_messages" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_tut_msg_session_idx" ON "acad_tutor_messages" ("session_id");

CREATE INDEX IF NOT EXISTS "acad_mstr_tenant_idx" ON "acad_learner_mastery" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_mstr_user_idx" ON "acad_learner_mastery" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_mstr_course_idx" ON "acad_learner_mastery" ("course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_mstr_uniq" ON "acad_learner_mastery" ("tenant_id", "user_id", "course_id", "concept_key");

CREATE INDEX IF NOT EXISTS "acad_rec_tenant_idx" ON "acad_adaptive_recommendations" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_rec_user_idx" ON "acad_adaptive_recommendations" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_rec_course_idx" ON "acad_adaptive_recommendations" ("course_id");

DO $$ BEGIN
 ALTER TABLE "acad_tutor_sessions" ADD CONSTRAINT "acad_tutor_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_tutor_sessions" ADD CONSTRAINT "acad_tutor_sessions_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_tutor_messages" ADD CONSTRAINT "acad_tutor_messages_session_id_acad_tutor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "acad_tutor_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_learner_mastery" ADD CONSTRAINT "acad_learner_mastery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_learner_mastery" ADD CONSTRAINT "acad_learner_mastery_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_adaptive_recommendations" ADD CONSTRAINT "acad_adaptive_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_adaptive_recommendations" ADD CONSTRAINT "acad_adaptive_recommendations_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
