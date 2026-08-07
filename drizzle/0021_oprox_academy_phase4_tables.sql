CREATE TABLE IF NOT EXISTS "acad_org_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"target_audience" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_org_program_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"program_id" text NOT NULL,
	"course_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_cohorts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_cohort_members" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"cohort_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_org_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"target_type" text DEFAULT 'ORGANIZATION' NOT NULL,
	"target_id" text,
	"assignment_type" text DEFAULT 'COURSE' NOT NULL,
	"item_course_id" text,
	"item_program_id" text,
	"due_date" timestamp,
	"assigned_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_instructor_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"instructor_user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"role" text DEFAULT 'PRIMARY' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_admin_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"admin_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "acad_prog_tenant_idx" ON "acad_org_programs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_prog_org_idx" ON "acad_org_programs" ("org_id");

CREATE INDEX IF NOT EXISTS "acad_prog_crs_tenant_idx" ON "acad_org_program_courses" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_prog_crs_prog_idx" ON "acad_org_program_courses" ("program_id");

CREATE INDEX IF NOT EXISTS "acad_chrt_tenant_idx" ON "acad_cohorts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_chrt_org_idx" ON "acad_cohorts" ("org_id");

CREATE INDEX IF NOT EXISTS "acad_chrt_mem_tenant_idx" ON "acad_cohort_members" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_chrt_mem_chrt_idx" ON "acad_cohort_members" ("cohort_id");
CREATE INDEX IF NOT EXISTS "acad_chrt_mem_user_idx" ON "acad_cohort_members" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_chrt_mem_uniq" ON "acad_cohort_members" ("tenant_id", "cohort_id", "user_id");

CREATE INDEX IF NOT EXISTS "acad_org_asgn_tenant_idx" ON "acad_org_assignments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_org_asgn_org_idx" ON "acad_org_assignments" ("org_id");

CREATE INDEX IF NOT EXISTS "acad_inst_crs_tenant_idx" ON "acad_instructor_courses" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_inst_crs_inst_idx" ON "acad_instructor_courses" ("instructor_user_id");
CREATE INDEX IF NOT EXISTS "acad_inst_crs_course_idx" ON "acad_instructor_courses" ("course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_inst_crs_uniq" ON "acad_instructor_courses" ("tenant_id", "instructor_user_id", "course_id");

CREATE INDEX IF NOT EXISTS "acad_adm_log_tenant_idx" ON "acad_admin_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_adm_log_admin_idx" ON "acad_admin_logs" ("admin_user_id");

DO $$ BEGIN
 ALTER TABLE "acad_org_programs" ADD CONSTRAINT "acad_org_programs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_org_program_courses" ADD CONSTRAINT "acad_org_program_courses_program_id_acad_org_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "acad_org_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_org_program_courses" ADD CONSTRAINT "acad_org_program_courses_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_cohorts" ADD CONSTRAINT "acad_cohorts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_cohort_members" ADD CONSTRAINT "acad_cohort_members_cohort_id_acad_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "acad_cohorts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_cohort_members" ADD CONSTRAINT "acad_cohort_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_org_assignments" ADD CONSTRAINT "acad_org_assignments_item_course_id_acad_courses_id_fk" FOREIGN KEY ("item_course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_org_assignments" ADD CONSTRAINT "acad_org_assignments_item_program_id_acad_org_programs_id_fk" FOREIGN KEY ("item_program_id") REFERENCES "acad_org_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_org_assignments" ADD CONSTRAINT "acad_org_assignments_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_instructor_courses" ADD CONSTRAINT "acad_instructor_courses_instructor_user_id_users_id_fk" FOREIGN KEY ("instructor_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_instructor_courses" ADD CONSTRAINT "acad_instructor_courses_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_admin_logs" ADD CONSTRAINT "acad_admin_logs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
