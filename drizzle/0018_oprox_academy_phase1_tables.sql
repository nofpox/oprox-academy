CREATE TABLE IF NOT EXISTS "acad_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"headline" text,
	"bio" text,
	"avatar_url" text,
	"prefer_language" text DEFAULT 'en' NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_instructor_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"bio" text,
	"expertise_areas_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"social_links_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rating" numeric DEFAULT '5.0',
	"total_students" integer DEFAULT 0,
	"total_courses" integer DEFAULT 0,
	"verification_status" text DEFAULT 'VERIFIED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"slug" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"icon" text DEFAULT 'BookOpen',
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_learning_paths" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"slug" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"level" text DEFAULT 'ALL_LEVELS' NOT NULL,
	"estimated_hours" integer DEFAULT 10,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"category_id" text,
	"learning_path_id" text,
	"instructor_id" text,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"slug" text NOT NULL,
	"summary_en" text,
	"summary_ar" text,
	"description_en" text,
	"description_ar" text,
	"language" text DEFAULT 'both' NOT NULL,
	"level" text DEFAULT 'ALL_LEVELS' NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"estimated_duration_minutes" integer DEFAULT 120,
	"thumbnail_url" text,
	"price_sar" numeric DEFAULT '0',
	"currency" text DEFAULT 'SAR',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"description_en" text,
	"description_ar" text,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"module_id" text NOT NULL,
	"course_id" text NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"summary_en" text,
	"summary_ar" text,
	"lesson_type" text DEFAULT 'TEXT' NOT NULL,
	"content_en" text,
	"content_ar" text,
	"duration_minutes" integer DEFAULT 15,
	"video_url" text,
	"display_order" integer DEFAULT 1 NOT NULL,
	"is_preview" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"resource_type" text DEFAULT 'LINK' NOT NULL,
	"resource_url" text NOT NULL,
	"file_size_bytes" integer,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "acad_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "acad_prof_tenant_idx" ON "acad_profiles" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_prof_user_idx" ON "acad_profiles" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_prof_tenant_user_uniq" ON "acad_profiles" ("tenant_id", "user_id");

CREATE INDEX IF NOT EXISTS "acad_inst_tenant_idx" ON "acad_instructor_profiles" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_inst_user_idx" ON "acad_instructor_profiles" ("user_id");

CREATE INDEX IF NOT EXISTS "acad_cat_tenant_idx" ON "acad_categories" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_cat_tenant_slug_uniq" ON "acad_categories" ("tenant_id", "slug");

CREATE INDEX IF NOT EXISTS "acad_path_tenant_idx" ON "acad_learning_paths" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_path_tenant_slug_uniq" ON "acad_learning_paths" ("tenant_id", "slug");

CREATE INDEX IF NOT EXISTS "acad_crs_tenant_idx" ON "acad_courses" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_crs_cat_idx" ON "acad_courses" ("category_id");
CREATE INDEX IF NOT EXISTS "acad_crs_path_idx" ON "acad_courses" ("learning_path_id");
CREATE INDEX IF NOT EXISTS "acad_crs_inst_idx" ON "acad_courses" ("instructor_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_crs_tenant_slug_uniq" ON "acad_courses" ("tenant_id", "slug");

CREATE INDEX IF NOT EXISTS "acad_mod_tenant_idx" ON "acad_modules" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_mod_course_idx" ON "acad_modules" ("course_id");

CREATE INDEX IF NOT EXISTS "acad_lsn_tenant_idx" ON "acad_lessons" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_lsn_mod_idx" ON "acad_lessons" ("module_id");
CREATE INDEX IF NOT EXISTS "acad_lsn_crs_idx" ON "acad_lessons" ("course_id");

CREATE INDEX IF NOT EXISTS "acad_res_tenant_idx" ON "acad_resources" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_res_lsn_idx" ON "acad_resources" ("lesson_id");

CREATE INDEX IF NOT EXISTS "acad_enr_tenant_idx" ON "acad_enrollments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "acad_enr_user_idx" ON "acad_enrollments" ("user_id");
CREATE INDEX IF NOT EXISTS "acad_enr_crs_idx" ON "acad_enrollments" ("course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "acad_enr_tenant_user_crs_uniq" ON "acad_enrollments" ("tenant_id", "user_id", "course_id");

DO $$ BEGIN
 ALTER TABLE "acad_profiles" ADD CONSTRAINT "acad_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_instructor_profiles" ADD CONSTRAINT "acad_instructor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_courses" ADD CONSTRAINT "acad_courses_category_id_acad_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "acad_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_courses" ADD CONSTRAINT "acad_courses_learning_path_id_acad_learning_paths_id_fk" FOREIGN KEY ("learning_path_id") REFERENCES "acad_learning_paths"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_courses" ADD CONSTRAINT "acad_courses_instructor_id_acad_instructor_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "acad_instructor_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_modules" ADD CONSTRAINT "acad_modules_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_lessons" ADD CONSTRAINT "acad_lessons_module_id_acad_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "acad_modules"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_lessons" ADD CONSTRAINT "acad_lessons_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_resources" ADD CONSTRAINT "acad_resources_lesson_id_acad_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "acad_lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_enrollments" ADD CONSTRAINT "acad_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "acad_enrollments" ADD CONSTRAINT "acad_enrollments_course_id_acad_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "acad_courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
