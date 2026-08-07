import { describe, it, expect } from 'vitest';
import {
  STUDIO_IR_VERSION,
  createDefaultStudioIr,
  validateStudioIr,
  StudioIr,
} from '../src/lib/studio/studioIr';
import { compileStudioIr } from '../src/lib/studio/studioCompiler';
import { generateDrizzleSchemaCode } from '../src/lib/studio/studioDrizzleGenerator';
import { importCodeToStudioSubset } from '../src/lib/studio/studioImporter';
import { validateStudioFlowGraph, simulateFlowExecution } from '../src/lib/studio/studioFlowEngine';
import { validateStudioSchemaModel } from '../src/lib/studio/studioSchemaEngine';
import {
  createStudioProject,
  getStudioProjectIr,
  listStudioProjects,
  saveStudioProjectIr,
  promoteStudioProjectToWorkspace,
} from '../src/lib/studio/studioStore';
import { processStudioCopilotRequest } from '../src/lib/studio/studioCopilot';

describe('OPROX Studio Phase 1 — Visual Application Builder Test Suite', () => {
  const tenantId = 'tenant_studio_test';
  const orgId = 'org_studio_test';
  const authorId = 'user_author_1';

  describe('1. Studio Intermediate Representation (IR) & Validation Engine', () => {
    it('creates default Studio IR with version 1.0.0 and valid root page structure', () => {
      const ir = createDefaultStudioIr('proj_1', tenantId, 'Test App');
      expect(ir.version).toBe(STUDIO_IR_VERSION);
      expect(ir.project.id).toBe('proj_1');
      expect(ir.pages.length).toBeGreaterThan(0);
      expect(ir.pages[0].rootNode.type).toBe('Container');

      const validation = validateStudioIr(ir);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('rejects IR with invalid version', () => {
      const ir = createDefaultStudioIr('proj_1', tenantId, 'Test App');
      (ir as any).version = '2.0.0';
      const validation = validateStudioIr(ir);
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('Invalid IR version');
    });

    it('rejects IR containing script injection attack payloads in node props or styles', () => {
      const ir = createDefaultStudioIr('proj_1', tenantId, 'Test App');
      ir.pages[0].rootNode.props.malicious = '<script>alert("xss")</script>';
      const validation = validateStudioIr(ir);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('script injection'))).toBe(true);
    });

    it('detects excessive component nesting depth (>20 levels)', () => {
      const ir = createDefaultStudioIr('proj_1', tenantId, 'Test App');
      let current = ir.pages[0].rootNode;
      for (let i = 0; i < 22; i++) {
        const next = { id: `nested_${i}`, type: 'Container' as const, name: `Nest ${i}`, props: {}, style: {}, children: [] };
        current.children = [next];
        current = next;
      }
      const validation = validateStudioIr(ir);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('maximum component nesting depth'))).toBe(true);
    });
  });

  describe('2. Studio Compiler & Code Generator', () => {
    it('compiles Studio IR into deterministic React TypeScript page components', () => {
      const ir = createDefaultStudioIr('proj_comp_1', tenantId, 'Compiled App');
      const compiled = compileStudioIr(ir);

      expect(compiled.pages.length).toBe(1);
      expect(compiled.pages[0].filePath).toBe('src/pages/index.tsx');
      expect(compiled.pages[0].code).toContain('export const PageMainPage');
      expect(compiled.pages[0].code).toContain("import React from 'react';");
      expect(compiled.themeCssCode).toContain('--studio-bg-canvas');
    });

    it('generates production-grade Drizzle ORM PostgreSQL schema code from Studio Schema Model', () => {
      const ir = createDefaultStudioIr('proj_schema_1', tenantId, 'Schema App');
      const drizzleCode = generateDrizzleSchemaCode(ir.schema);

      expect(drizzleCode).toContain('import { pgTable, text');
      expect(drizzleCode).toContain('export const usersTable = pgTable(');
      expect(drizzleCode).toContain('id: text("id").primaryKey()');
    });
  });

  describe('3. Studio Bounded Code Importer', () => {
    it('returns SUPPORTED for standard React JSX headings and buttons', () => {
      const code = `
        export default function App() {
          return (
            <div>
              <h1>Welcome to OPROX</h1>
              <p>Visual Builder</p>
              <button>Click Here</button>
            </div>
          );
        }
      `;
      const res = importCodeToStudioSubset(code, 'proj_1', tenantId);
      expect(res.status).toBe('SUPPORTED');
      expect(res.importedIr?.pages?.[0]?.rootNode?.children?.length).toBeGreaterThan(0);
    });

    it('returns PARTIALLY_SUPPORTED for code with complex hooks or custom state', () => {
      const code = `
        import { useEffect } from 'react';
        export default function ComplexApp() {
          useEffect(() => { fetch('/api'); }, []);
          return <div>Static View</div>;
        }
      `;
      const res = importCodeToStudioSubset(code, 'proj_1', tenantId);
      expect(res.status).toBe('PARTIALLY_SUPPORTED');
      expect(res.unsupportedConstructs).toContain('COMPLEX_REACT_HOOKS');
    });

    it('returns UNSUPPORTED for code with script injection', () => {
      const code = `<script>window.location='http://evil.com';</script>`;
      const res = importCodeToStudioSubset(code, 'proj_1', tenantId);
      expect(res.status).toBe('UNSUPPORTED');
      expect(res.message).toContain('rejected for security');
    });
  });

  describe('4. Studio Schema Builder Engine & Flow Engine', () => {
    it('validates relational schema model and detects duplicate column names', () => {
      const res = validateStudioSchemaModel({
        tables: [
          {
            name: 'orders',
            columns: [
              { name: 'id', type: 'text', isPrimaryKey: true },
              { name: 'id', type: 'integer' }, // duplicate column
            ],
          },
        ],
      });
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('duplicate column name');
    });

    it('detects infinite cycle loops in flow graphs', () => {
      const res = validateStudioFlowGraph({
        nodes: [
          { id: 'n1', kind: 'TRIGGER', label: 'Start', config: {}, position: { x: 0, y: 0 } },
          { id: 'n2', kind: 'ACTION', label: 'Loop Action', config: {}, position: { x: 100, y: 0 } },
        ],
        edges: [
          { id: 'e1', sourceId: 'n1', targetId: 'n2' },
          { id: 'e2', sourceId: 'n2', targetId: 'n1' }, // Cycle
        ],
      });
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('Infinite cycle loop detected');
    });

    it('simulates flow graph execution step-by-step', () => {
      const ir = createDefaultStudioIr('proj_flow_1', tenantId, 'Flow App');
      const sim = simulateFlowExecution(ir.flows, { initialKey: 'initialValue' });
      expect(sim.steps.length).toBeGreaterThan(0);
      expect(sim.steps[0].kind).toBe('TRIGGER');
      expect(sim.finalState.lastEvent).toBe('TRIGGER_FIRED');
    });
  });

  describe('5. Studio Store, OCC Revision Control & Code Promotion', () => {
    it('creates, reads, lists, and saves Studio project IR with OCC', async () => {
      const proj = await createStudioProject({
        tenantId,
        orgId,
        name: 'Persisted App',
        createdBy: authorId,
      });

      expect(proj.id).toContain('proj_studio_');
      expect(proj.activeRevisionNumber).toBe(1);

      const loaded = await getStudioProjectIr(proj.id, tenantId);
      expect(loaded).not.toBeNull();
      expect(loaded?.meta.name).toBe('Persisted App');

      const projects = await listStudioProjects(tenantId);
      expect(projects.some((p) => p.id === proj.id)).toBe(true);

      // Save updated IR with correct base revision (1 -> 2)
      const updatedIr = JSON.parse(JSON.stringify(loaded!.ir));
      updatedIr.pages[0].name = 'Updated Main Page';

      const saveRes = await saveStudioProjectIr({
        projectId: proj.id,
        tenantId,
        authorId,
        baseRevisionNumber: 1,
        updatedIr,
        changeSummary: 'Renamed main page',
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.newRevisionNumber).toBe(2);

      // OCC Conflict check: attempt save with stale base revision 1 (when active is 2)
      const staleSaveRes = await saveStudioProjectIr({
        projectId: proj.id,
        tenantId,
        authorId,
        baseRevisionNumber: 1,
        updatedIr,
        changeSummary: 'Stale update',
      });

      expect(staleSaveRes.success).toBe(false);
      expect(staleSaveRes.conflict).toBe(true);
    });

    it('promotes Studio project into Code / AI platform VFS workspace', async () => {
      const proj = await createStudioProject({
        tenantId,
        orgId,
        name: 'Promoted Studio App',
        createdBy: authorId,
      });

      const promoRes = await promoteStudioProjectToWorkspace({
        projectId: proj.id,
        tenantId,
        promotedBy: authorId,
      });

      expect(promoRes.success).toBe(true);
      expect(promoRes.workspaceProjectId).toBeDefined();
      expect(promoRes.changeRequestId).toContain('cr_studio_');
      expect(promoRes.compiledPagesCount).toBeGreaterThan(0);
      expect(promoRes.drizzleSchemaGenerated).toBe(true);
    });
  });

  describe('6. Studio Copilot', () => {
    it('processes user prompt and generates proposed Studio IR modifications', async () => {
      const ir = createDefaultStudioIr('proj_copilot_1', tenantId, 'Copilot App');
      const copilotRes = await processStudioCopilotRequest({
        projectId: 'proj_copilot_1',
        tenantId,
        prompt: 'Add a pricing card with monthly plan options',
        scope: 'ALL',
        currentIr: ir,
      });

      expect(copilotRes.summary).toBeDefined();
      expect(copilotRes.proposedIr).toBeDefined();
      expect(copilotRes.proposedIr.version).toBe(STUDIO_IR_VERSION);
    });
  });
});
