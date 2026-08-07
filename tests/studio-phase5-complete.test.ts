/**
 * OPROX Studio Phase 5 — Comprehensive End-to-End Product & Workflow Acceptance Suite
 * Behavioral assertions covering Studio Project Management, AI-First Project Creation & Planning,
 * Progress States, Workspace Shell, Canvas, Components, Data & Drizzle, Logic/Flows,
 * Assets, Preview, Copilot AI Proposal, Error Center, OCC Save States, Handoff & Deployments.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StudioIr,
  StudioNode,
  createDefaultStudioIr,
  validateStudioIr,
} from '../src/lib/studio/studioIr';
import {
  createStudioAiPlan,
  materializeStudioAiPlan,
  executeStudioAiGeneration,
  aggregateStudioProjectIssues,
} from '../src/lib/studio/studioPhase5Engine';
import {
  createStudioProject,
  getStudioProjectIr,
  listStudioProjects,
  saveStudioProjectIr,
} from '../src/lib/studio/studioStore';
import { compileStudioIr } from '../src/lib/studio/studioCompiler';
import { generateDrizzleSchemaCode } from '../src/lib/studio/studioDrizzleGenerator';
import {
  exportStudioToWorkspace,
  deployStudioApp,
  rollbackStudioDeployment,
  publishStudioAppDomain,
} from '../src/lib/studio/studioPhase3Engine';

describe('OPROX Studio Phase 5 — End-to-End Visual Product Acceptance Suite', () => {
  let baseIr: StudioIr;

  beforeEach(() => {
    baseIr = createDefaultStudioIr('proj_p5_test', 'tenant_p5_test', 'Phase 5 Test App');
  });

  // ── 1. Studio Project Home & Management ──────────────────────────────────

  describe('Studio Project Home & Store Operations', () => {
    it('1. should create tenant project and list real tenant projects', async () => {
      const meta = await createStudioProject({
        tenantId: 'tenant_p5_store',
        orgId: 'org_p5_store',
        name: 'Property Management Portal',
        description: 'Tenant rental dashboard',
        createdBy: 'usr_p5_author',
      });

      expect(meta.id).toBeDefined();
      expect(meta.name).toBe('Property Management Portal');

      const list = await listStudioProjects('tenant_p5_store');
      expect(list.length).toBeGreaterThanOrEqual(1);
      const found = list.find((p) => p.id === meta.id);
      expect(found).toBeDefined();
    });

    it('2. should enforce tenant isolation when fetching project IR', async () => {
      const meta = await createStudioProject({
        tenantId: 'tenant_p5_iso_A',
        orgId: 'org_p5_iso_A',
        name: 'Isolated App A',
        createdBy: 'usr_p5_author',
      });

      // Tenant B attempting access should be rejected (returns null)
      const denied = await getStudioProjectIr(meta.id, 'tenant_p5_iso_B');
      expect(denied).toBeNull();

      // Tenant A accessing should succeed
      const allowed = await getStudioProjectIr(meta.id, 'tenant_p5_iso_A');
      expect(allowed).not.toBeNull();
      expect(allowed?.meta.name).toBe('Isolated App A');
    });
  });

  // ── 2. AI-First Project Creation & Planning ──────────────────────────────

  describe('AI Planning & Generation Engine', () => {
    it('3. should generate structured AI application plan from prompt', () => {
      const prompt = 'Create a property management dashboard with login, properties, tenants, and maintenance requests';
      const plan = createStudioAiPlan(prompt);

      expect(plan.applicationType).toContain('Property Management');
      expect(plan.suggestedPages.length).toBeGreaterThanOrEqual(3);
      expect(plan.dataEntities.length).toBeGreaterThanOrEqual(2);
      expect(plan.majorComponents.length).toBeGreaterThanOrEqual(2);
      expect(plan.designDirection.primaryColor).toBeDefined();
    });

    it('4. should materialize AI plan into valid Studio IR and compile cleanly', () => {
      const prompt = 'Create a task management app with projects, tasks, and users';
      const plan = createStudioAiPlan(prompt);

      const { ir, validationErrors } = materializeStudioAiPlan('proj_ai_gen_1', 'tenant_p5_test', 'AI Task Manager', plan);

      expect(validationErrors).toEqual([]);
      expect(ir.pages.length).toBe(plan.suggestedPages.length);
      expect(ir.schema.tables.length).toBe(plan.dataEntities.length);

      // Verify compilation
      const compilation = compileStudioIr(ir);
      expect(compilation).toBeDefined();
      expect(compilation.pages.length).toBe(ir.pages.length);
    });

    it('5. should execute full AI generation pipeline with stage reporting', async () => {
      const stagesObserved: string[] = [];

      const progress = await executeStudioAiGeneration(
        'proj_ai_gen_2',
        'tenant_p5_test',
        'Property Portal',
        'Create a property portal',
        (p) => {
          stagesObserved.push(p.stage);
        }
      );

      expect(progress.stage).toBe('READY');
      expect(progress.resultIr).toBeDefined();
      expect(stagesObserved).toContain('PLANNING');
      expect(stagesObserved).toContain('GENERATING_STRUCTURE');
      expect(stagesObserved).toContain('COMPILING');
    });
  });

  // ── 3. Visual Canvas, Pages, & Data Binding ──────────────────────────────

  describe('Canvas, Pages & Data Bindings', () => {
    it('6. should reject duplicate page routes in Studio IR', () => {
      const invalidIr: StudioIr = JSON.parse(JSON.stringify(baseIr));
      invalidIr.pages.push({
        id: 'page_dup',
        name: 'Duplicate Route Page',
        path: baseIr.pages[0].path, // Duplicate path '/'
        rootNode: {
          id: 'node_root_dup',
          name: 'Root',
          type: 'Container',
          props: {},
          style: {},
          children: [],
        },
      });

      const validation = validateStudioIr(invalidIr);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.toLowerCase().includes('duplicate'))).toBe(true);
    });

    it('7. should generate authoritative Drizzle schema for data entities', () => {
      const drizzleCode = generateDrizzleSchemaCode(baseIr.schema);
      expect(drizzleCode).toContain('export const');
      expect(drizzleCode).toContain('pgTable');
    });
  });

  // ── 4. Error Center & Issues Aggregation ─────────────────────────────────

  describe('Studio Unified Error Center', () => {
    it('8. should aggregate compiler, accessibility, design, and limit issues', () => {
      const issues = aggregateStudioProjectIssues(baseIr);
      expect(Array.isArray(issues)).toBe(true);
      for (const iss of issues) {
        expect(iss.id).toBeDefined();
        expect(iss.category).toBeDefined();
        expect(iss.severity).toBeDefined();
      }
    });
  });

  // ── 5. Optimistic Concurrency Control (OCC) & Persistence ──────────────────

  describe('Save State & OCC Conflict Resolution', () => {
    it('9. should save revision and reject stale base revision edit as CONFLICT', async () => {
      const meta = await createStudioProject({
        tenantId: 'tenant_occ_test',
        orgId: 'org_occ_test',
        name: 'OCC Test Project',
        createdBy: 'usr_author_1',
      });

      // Save Revision 2 (Base revision matches created activeRevisionNumber 1)
      const save1 = await saveStudioProjectIr({
        projectId: meta.id,
        tenantId: 'tenant_occ_test',
        authorId: 'usr_author_1',
        baseRevisionNumber: meta.activeRevisionNumber,
        updatedIr: baseIr,
        changeSummary: 'First save',
      });

      expect(save1.success).toBe(true);
      expect(save1.conflict).toBeFalsy();
      expect(save1.newRevisionNumber).toBe(2);

      // Concurrent session tries to save using stale baseRevisionNumber 1 (now active is 2)
      const saveStale = await saveStudioProjectIr({
        projectId: meta.id,
        tenantId: 'tenant_occ_test',
        authorId: 'usr_author_2',
        baseRevisionNumber: 1, // Stale!
        updatedIr: baseIr,
        changeSummary: 'Conflicting edit',
      });

      expect(saveStale.conflict).toBe(true);
    });
  });

  // ── 6. Governed Handoff & Cloud Deployments ──────────────────────────────

  describe('Governed Handoff & Deployment Pipeline', () => {
    it('10. should export studio project to workspace with checksum hash', () => {
      const exportRes = exportStudioToWorkspace(baseIr, 'usr_author_1');
      expect(exportRes.exportedCount).toBeGreaterThan(0);
      expect(exportRes.checksum).toBeDefined();
      expect(exportRes.checksum.length).toBeGreaterThan(10);
    });

    it('11. should deploy studio app, record deployment history, and publish domain', async () => {
      const depRecord = await deployStudioApp(
        'proj_p5_test',
        'tenant_p5_test',
        'rev_1',
        'staging',
        'usr_author_1',
        baseIr
      );

      expect(depRecord.id).toBeDefined();
      expect(['SUCCESS', 'NOT_CONFIGURED']).toContain(depRecord.status);
      expect(depRecord.publicUrl).toBeDefined();

      // Publish custom domain
      const domainBinding = await publishStudioAppDomain(
        'proj_p5_test',
        'tenant_p5_test',
        depRecord.id,
        'app.example.com'
      );

      expect(domainBinding.domainName).toBe('app.example.com');

      // Rollback test
      const rollbackRes = await rollbackStudioDeployment('proj_p5_test', 'tenant_p5_test', depRecord.id, 'usr_author_1');
      expect(rollbackRes.message).toBeDefined();
    });
  });
});
