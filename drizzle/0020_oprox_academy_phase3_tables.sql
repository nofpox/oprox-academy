CREATE TABLE IF NOT EXISTS "acad_assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text,
	"lesson_id" text,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"passing_score_percent" integer DEFAULT 70 NOT NULL,
	"max_attempts" integer DEFAULT 3,
	"time_limit_minutes" integer DEFAULT 0,
	"shuffle_questions" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_assessment_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"assessment_id" text NOT NULL,
	"question_text_en" text NOT NULL,
	"question_text_ar" text NOT NULL,
	"question_type" text DEFAULT 'SINGLE_CHOICE' NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"explanation_en" text,
	"explanation_ar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_assessment_choices" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"question_id" text NOT NULL,
	"choice_text_en" text NOT NULL,
	"choice_text_ar" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_assessment_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assessment_id" text NOT NULL,
	"course_id" text NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"score_points" integer DEFAULT 0,
	"max_points" integer DEFAULT 0,
	"score_percent" integer DEFAULT 0,
	"passed" boolean DEFAULT false,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "acad_learner_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"selected_choice_ids" text,
	"short_answer_text" text,
	"is_correct" boolean DEFAULT false,
	"points_earned" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"module_id" text,
	"lesson_id" text,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"instructions_en" text,
	"instructions_ar" text,
	"max_score" integer DEFAULT 100 NOT NULL,
	"passing_score" integer DEFAULT 60 NOT NULL,
	"allow_resubmission" boolean DEFAULT true NOT NULL,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_assignment_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"course_id" text NOT NULL,
	"submission_text" text,
	"resource_urls" text,
	"status" text DEFAULT 'SUBMITTED' NOT NULL,
	"score" integer,
	"instructor_feedback_en" text,
	"instructor_feedback_ar" text,
	"graded_by_user_id" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"graded_at" timestamp
);

CREATE TABLE IF NOT EXISTS "acad_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"certificate_number" text NOT NULL,
	"verification_code" text NOT NULL,
	"completion_score_percent" integer DEFAULT 100 NOT NULL,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'ISSUED' NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "acad_asmt_tenant_idx" ON "acad_assessments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_asmt_crs_idx" ON "acad_assessments" ("course_id");

CREATE INDEX IF NOT EXISTS "acad_quest_tenant_idx" ON "acad_assessment_questions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_quest_asmt_idx" ON "acad_assessment_questions" ("assessment_id");

CREATE INDEX IF NOT EXISTS "acad_choice_tenant_idx" ON "acad_assessment_choices" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_choice_quest_idx" ON "acad_assessment_choices" ("question_id");

CREATE INDEX IF NOT EXISTS "acad_att_tenant_idx" ON "acad_assessment_attempts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_att_user_idx" ON "acad_assessment_attempts" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_att_asmt_idx" ON "acad_assessment_attempts" ("assessment_id");

CREATE INDEX IF NOT EXISTS "acad_ans_tenant_idx" ON "acad_learner_answers" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_ans_att_idx" ON "acad_learner_answers" ("attempt_id");

CREATE INDEX IF NOT EXISTS "acad_asgn_tenant_idx" ON "acad_assignments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_asgn_crs_idx" ON "acad_assignments" ("course_id");

CREATE INDEX IF NOT EXISTS "acad_sub_tenant_idx" ON "acad_assignment_submissions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_sub_user_idx" ON "acad_assignment_submissions" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_sub_asgn_idx" ON "acad_assignment_submissions" ("assignment_id");

CREATE INDEX IF NOT EXISTS "acad_cert_tenant_idx" ON "acad_certificates" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_cert_user_idx" ON "acad_certificates" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_cert_crs_idx" ON "acad_certificates" ("course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_cert_num_uniq" ON "acad_certificates" ("certificate_number");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_cert_vcode_uniq" ON "acad_certificates" ("verification_code");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_cert_tenant_user_crs_uniq" ON "acad_certificates" ("tenant_id", "user_id", "course_id");

DO $$ BEGIN
 ALTER TABLE "acad_assessments" ADD CONSTRAINT "acad_assessments_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_assessment_questions" ADD CONSTRAINT "acad_assessment_questions_assessment_id_acad_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "acad_assessments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_assessment_choices" ADD CONSTRAINT "acad_assessment_choices_question_id_acad_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "acad_assessment_questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_assessment_attempts" ADD CONSTRAINT "acad_assessment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_assessment_attempts" ADD CONSTRAINT "acad_assessment_attempts_assessment_id_acad_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "acad_assessments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_learner_answers" ADD CONSTRAINT "acad_learner_answers_attempt_id_acad_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "acad_assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_assignments" ADD CONSTRAINT "acad_assignments_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_assignment_submissions" ADD CONSTRAINT "acad_assignment_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_assignment_submissions" ADD CONSTRAINT "acad_assignment_submissions_assignment_id_acad_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "acad_assignments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_certificates" ADD CONSTRAINT "acad_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_certificates" ADD CONSTRAINT "acad_certificates_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
