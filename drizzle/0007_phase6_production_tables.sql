-- Phase 6: Production Repository, CI/CD & Delivery Tables

CREATE TABLE IF NOT EXISTS "phase6_repository_connections" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "org_id" text NOT NULL,
  "project_id" text,
  "provider" text NOT NULL,
  "repo_identifier" text NOT NULL,
  "repo_owner" text NOT NULL,
  "default_branch" text DEFAULT 'main' NOT NULL,
  "connection_status" text DEFAULT 'CONFIGURED' NOT NULL,
  "account_ref" text,
  "created_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "last_verified_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase6_repository_branches" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "project_id" text,
  "repo_id" text NOT NULL,
  "name" text NOT NULL,
  "type" text DEFAULT 'feature' NOT NULL,
  "owner_id" text NOT NULL,
  "originating_task_id" text,
  "change_request_id" text,
  "base_sha" text NOT NULL,
  "head_sha" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase6_commit_provenance" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "repo_id" text NOT NULL,
  "commit_sha" text NOT NULL,
  "author_type" text DEFAULT 'human' NOT NULL,
  "author_id" text NOT NULL,
  "requirement_id" text,
  "ai_task_id" text,
  "agent_id" text,
  "workspace_id" text,
  "branch_name" text NOT NULL,
  "change_request_id" text,
  "risk_level" text DEFAULT 'LOW' NOT NULL,
  "test_status" text DEFAULT 'NOT_RUN' NOT NULL,
  "security_review_status" text DEFAULT 'PASSED' NOT NULL,
  "approval_status" text DEFAULT 'APPROVED' NOT NULL,
  "ai_cost_usd" numeric(12, 4) DEFAULT '0.0000' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase6_ci_pipeline_definitions" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "project_id" text,
  "name" text NOT NULL,
  "stages" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "allowlisted_commands" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase6_ci_pipeline_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "project_id" text,
  "repo_id" text NOT NULL,
  "pipeline_id" text NOT NULL,
  "commit_sha" text NOT NULL,
  "branch_name" text NOT NULL,
  "trigger" text DEFAULT 'manual' NOT NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "stage_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "duration_ms" integer DEFAULT 0 NOT NULL,
  "artifacts" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "failure_evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "finished_at" timestamp
);

CREATE TABLE IF NOT EXISTS "phase6_build_artifacts" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "project_id" text,
  "repo_id" text NOT NULL,
  "pipeline_run_id" text NOT NULL,
  "commit_sha" text NOT NULL,
  "artifact_type" text NOT NULL,
  "name" text NOT NULL,
  "checksum_sha256" text NOT NULL,
  "size_bytes" integer DEFAULT 0 NOT NULL,
  "storage_ref" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase6_dev_environments" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "project_id" text,
  "name" text NOT NULL,
  "branch_name" text NOT NULL,
  "commit_sha" text NOT NULL,
  "provider" text DEFAULT 'local_runner' NOT NULL,
  "status" text DEFAULT 'REQUESTED' NOT NULL,
  "resource_ref" text,
  "created_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp
);

CREATE TABLE IF NOT EXISTS "phase6_preview_environments" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "project_id" text,
  "change_request_id" text NOT NULL,
  "commit_sha" text NOT NULL,
  "preview_url" text,
  "status" text DEFAULT 'REQUESTED' NOT NULL,
  "health_status" text DEFAULT 'UNKNOWN' NOT NULL,
  "created_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp
);

CREATE TABLE IF NOT EXISTS "phase6_provider_events" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "provider" text NOT NULL,
  "event_type" text NOT NULL,
  "repo_identifier" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "signature_verified" boolean DEFAULT false NOT NULL,
  "processed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase6_operation_locks" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "lock_key" text NOT NULL,
  "locked_by" text NOT NULL,
  "expires_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "p6_repo_conn_tenant_idx" ON "phase6_repository_connections" ("tenant_id");
CREATE INDEX IF NOT EXISTS "p6_repo_conn_provider_idx" ON "phase6_repository_connections" ("provider");
CREATE INDEX IF NOT EXISTS "p6_repo_branch_tenant_idx" ON "phase6_repository_branches" ("tenant_id");
CREATE INDEX IF NOT EXISTS "p6_repo_branch_repo_idx" ON "phase6_repository_branches" ("repo_id");
CREATE INDEX IF NOT EXISTS "p6_commit_prov_tenant_idx" ON "phase6_commit_provenance" ("tenant_id");
CREATE INDEX IF NOT EXISTS "p6_commit_prov_sha_idx" ON "phase6_commit_provenance" ("commit_sha");
CREATE INDEX IF NOT EXISTS "p6_ci_def_tenant_idx" ON "phase6_ci_pipeline_definitions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "p6_ci_run_tenant_idx" ON "phase6_ci_pipeline_runs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "p6_ci_run_repo_idx" ON "phase6_ci_pipeline_runs" ("repo_id");
CREATE INDEX IF NOT EXISTS "p6_artifact_tenant_idx" ON "phase6_build_artifacts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "p6_artifact_sha_idx" ON "phase6_build_artifacts" ("commit_sha");
CREATE INDEX IF NOT EXISTS "p6_dev_env_tenant_idx" ON "phase6_dev_environments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "p6_preview_env_tenant_idx" ON "phase6_preview_environments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "p6_preview_env_cr_idx" ON "phase6_preview_environments" ("change_request_id");
CREATE INDEX IF NOT EXISTS "p6_prov_evt_tenant_idx" ON "phase6_provider_events" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "p6_lock_tenant_key_idx" ON "phase6_operation_locks" ("tenant_id", "lock_key");
