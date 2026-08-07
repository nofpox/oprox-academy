/**
 * OPROX Studio Phase 1 — Studio Store & Persistence Engine
 * Authenticated persistent store with OCC (Optimistic Concurrency Control), revision history,
 * tenant isolation, and promotion into Code / AI VFS workspaces.
 */

import {
  StudioIr,
  StudioPageIR,
  StudioDesignTokens,
  StudioSchemaModel,
  StudioFlowGraph,
  createDefaultStudioIr,
  validateStudioIr,
} from './studioIr';
import { compileStudioIr } from './studioCompiler';
import { generateDrizzleSchemaCode } from './studioDrizzleGenerator';
import { db } from '../../db';
import {
  oproxStudioProjectsTable,
  oproxStudioCanvasesTable,
  oproxStudioDesignTokensTable,
  oproxStudioSchemasTable,
  oproxStudioFlowsTable,
  oproxStudioRevisionsTable,
  oproxStudioPromotionsTable,
} from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createWorkspaceProject } from '../workspaceProjects';

export interface StudioProjectMeta {
  id: string;
  tenantId: string;
  orgId: string;
  name: string;
  description: string;
  framework: string;
  theme: string;
  defaultPageId: string;
  activeRevisionNumber: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioRevisionRecord {
  id: string;
  projectId: string;
  revisionNumber: number;
  authorId: string;
  irSnapshot: StudioIr;
  changeSummary: string;
  createdAt: string;
}

// In-Memory store as fallback and fast cache
const memoryProjects = new Map<string, StudioProjectMeta>();
const memoryIrs = new Map<string, StudioIr>();
const memoryRevisions = new Map<string, StudioRevisionRecord[]>();

export async function createStudioProject(params: {
  tenantId: string;
  orgId: string;
  name: string;
  description?: string;
  createdBy: string;
}): Promise<StudioProjectMeta> {
  const id = `proj_studio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const meta: StudioProjectMeta = {
    id,
    tenantId: params.tenantId,
    orgId: params.orgId,
    name: params.name,
    description: params.description || 'OPROX Studio Visual Application Project',
    framework: 'react_tailwind',
    theme: 'dark_modern',
    defaultPageId: 'page_main',
    activeRevisionNumber: 1,
    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const initialIr = createDefaultStudioIr(id, params.tenantId, params.name);

  // DB Insert if DB active
  if (db) {
    try {
      await db.insert(oproxStudioProjectsTable).values({
        id,
        tenantId: params.tenantId,
        orgId: params.orgId,
        name: params.name,
        description: params.description,
        framework: 'react_tailwind',
        theme: 'dark_modern',
        defaultPageId: 'page_main',
        activeRevisionNumber: 1,
        createdBy: params.createdBy,
      });

      await db.insert(oproxStudioCanvasesTable).values({
        id: `canvas_${Date.now()}`,
        tenantId: params.tenantId,
        projectId: id,
        pageId: 'page_main',
        pageName: 'Main Page',
        pagePath: '/',
        ir: initialIr.pages[0].rootNode as any,
        revisionNumber: 1,
        updatedBy: params.createdBy,
      });

      await db.insert(oproxStudioDesignTokensTable).values({
        id: `dt_${Date.now()}`,
        tenantId: params.tenantId,
        projectId: id,
        tokens: initialIr.tokens as any,
        updatedBy: params.createdBy,
      });

      await db.insert(oproxStudioSchemasTable).values({
        id: `schema_${Date.now()}`,
        tenantId: params.tenantId,
        projectId: id,
        schemaModel: initialIr.schema as any,
        generatedDrizzleCode: generateDrizzleSchemaCode(initialIr.schema),
        updatedBy: params.createdBy,
      });

      await db.insert(oproxStudioFlowsTable).values({
        id: `flow_${Date.now()}`,
        tenantId: params.tenantId,
        projectId: id,
        flowGraph: initialIr.flows as any,
        updatedBy: params.createdBy,
      });

      await db.insert(oproxStudioRevisionsTable).values({
        id: `rev_1_${Date.now()}`,
        tenantId: params.tenantId,
        projectId: id,
        revisionNumber: 1,
        authorId: params.createdBy,
        irSnapshot: initialIr as any,
        changeSummary: 'Initial project creation snapshot.',
      });
    } catch (e) {
      console.warn('[Studio DB Insert Warning - Using Fallback Memory]', e);
    }
  }

  memoryProjects.set(id, meta);
  memoryIrs.set(id, initialIr);
  memoryRevisions.set(id, [
    {
      id: `rev_1_${Date.now()}`,
      projectId: id,
      revisionNumber: 1,
      authorId: params.createdBy,
      irSnapshot: initialIr,
      changeSummary: 'Initial project creation snapshot.',
      createdAt: now,
    },
  ]);

  return meta;
}

export async function getStudioProjectIr(
  projectId: string,
  tenantId: string
): Promise<{ meta: StudioProjectMeta; ir: StudioIr } | null> {
  let meta = memoryProjects.get(projectId);
  let ir = memoryIrs.get(projectId);

  if (db && (!meta || !ir)) {
    try {
      const projRows = await db
        .select()
        .from(oproxStudioProjectsTable)
        .where(and(eq(oproxStudioProjectsTable.id, projectId), eq(oproxStudioProjectsTable.tenantId, tenantId)));

      if (projRows.length > 0) {
        const row = projRows[0];
        meta = {
          id: row.id,
          tenantId: row.tenantId,
          orgId: row.orgId,
          name: row.name,
          description: row.description || '',
          framework: row.framework,
          theme: row.theme,
          defaultPageId: row.defaultPageId,
          activeRevisionNumber: row.activeRevisionNumber,
          createdBy: row.createdBy,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };

        // Fetch canvas, tokens, schema, flows
        const canvasRows = await db
          .select()
          .from(oproxStudioCanvasesTable)
          .where(and(eq(oproxStudioCanvasesTable.projectId, projectId), eq(oproxStudioCanvasesTable.tenantId, tenantId)));
        const tokenRows = await db
          .select()
          .from(oproxStudioDesignTokensTable)
          .where(and(eq(oproxStudioDesignTokensTable.projectId, projectId), eq(oproxStudioDesignTokensTable.tenantId, tenantId)));
        const schemaRows = await db
          .select()
          .from(oproxStudioSchemasTable)
          .where(and(eq(oproxStudioSchemasTable.projectId, projectId), eq(oproxStudioSchemasTable.tenantId, tenantId)));
        const flowRows = await db
          .select()
          .from(oproxStudioFlowsTable)
          .where(and(eq(oproxStudioFlowsTable.projectId, projectId), eq(oproxStudioFlowsTable.tenantId, tenantId)));

        const pages: StudioPageIR[] = canvasRows.map((c) => ({
          id: c.pageId,
          name: c.pageName,
          path: c.pagePath,
          rootNode: c.ir as any,
        }));

        ir = {
          version: '1.0.0',
          project: {
            id: meta.id,
            tenantId: meta.tenantId,
            name: meta.name,
            framework: meta.framework,
          },
          tokens: (tokenRows[0]?.tokens as any) || {},
          pages: pages.length > 0 ? pages : createDefaultStudioIr(meta.id, meta.tenantId, meta.name).pages,
          schema: (schemaRows[0]?.schemaModel as any) || { tables: [] },
          flows: (flowRows[0]?.flowGraph as any) || { nodes: [], edges: [] },
          reusableComponents: [],
        };

        memoryProjects.set(projectId, meta);
        memoryIrs.set(projectId, ir);
      }
    } catch (e) {
      console.warn('[Studio DB Select Error]', e);
    }
  }

  if (!meta || !ir) return null;
  if (meta.tenantId !== tenantId) return null;

  return { meta, ir };
}

export async function listStudioProjects(tenantId: string): Promise<StudioProjectMeta[]> {
  const result: StudioProjectMeta[] = [];

  for (const proj of memoryProjects.values()) {
    if (proj.tenantId === tenantId) {
      result.push(proj);
    }
  }

  if (db) {
    try {
      const dbRows = await db
        .select()
        .from(oproxStudioProjectsTable)
        .where(eq(oproxStudioProjectsTable.tenantId, tenantId));

      for (const row of dbRows) {
        if (!result.some((p) => p.id === row.id)) {
          result.push({
            id: row.id,
            tenantId: row.tenantId,
            orgId: row.orgId,
            name: row.name,
            description: row.description || '',
            framework: row.framework,
            theme: row.theme,
            defaultPageId: row.defaultPageId,
            activeRevisionNumber: row.activeRevisionNumber,
            createdBy: row.createdBy,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          });
        }
      }
    } catch (e) {
      console.warn('[Studio DB List Error]', e);
    }
  }

  return result;
}

export async function saveStudioProjectIr(params: {
  projectId: string;
  tenantId: string;
  authorId: string;
  baseRevisionNumber: number;
  updatedIr: StudioIr;
  changeSummary: string;
}): Promise<{ success: boolean; newRevisionNumber: number; conflict?: boolean }> {
  const existing = await getStudioProjectIr(params.projectId, params.tenantId);
  if (!existing) {
    throw new Error(`Studio project ${params.projectId} not found or tenant access denied.`);
  }

  const { meta, ir: currentIr } = existing;

  // Optimistic Concurrency Control (OCC)
  if (params.baseRevisionNumber !== meta.activeRevisionNumber) {
    return {
      success: false,
      newRevisionNumber: meta.activeRevisionNumber,
      conflict: true,
    };
  }

  // Validate updated IR
  const validation = validateStudioIr(params.updatedIr);
  if (!validation.valid) {
    throw new Error(`Invalid Studio IR: ${validation.errors.join('; ')}`);
  }

  const nextRevNumber = meta.activeRevisionNumber + 1;
  const now = new Date().toISOString();

  const updatedMeta: StudioProjectMeta = {
    ...meta,
    activeRevisionNumber: nextRevNumber,
    updatedAt: now,
  };

  memoryProjects.set(params.projectId, updatedMeta);
  memoryIrs.set(params.projectId, params.updatedIr);

  const revRecord: StudioRevisionRecord = {
    id: `rev_${nextRevNumber}_${Date.now()}`,
    projectId: params.projectId,
    revisionNumber: nextRevNumber,
    authorId: params.authorId,
    irSnapshot: params.updatedIr,
    changeSummary: params.changeSummary,
    createdAt: now,
  };

  const revs = memoryRevisions.get(params.projectId) || [];
  revs.push(revRecord);
  memoryRevisions.set(params.projectId, revs);

  if (db) {
    try {
      await db
        .update(oproxStudioProjectsTable)
        .set({ activeRevisionNumber: nextRevNumber, updatedAt: new Date() })
        .where(and(eq(oproxStudioProjectsTable.id, params.projectId), eq(oproxStudioProjectsTable.tenantId, params.tenantId)));

      await db.insert(oproxStudioRevisionsTable).values({
        id: revRecord.id,
        tenantId: params.tenantId,
        projectId: params.projectId,
        revisionNumber: nextRevNumber,
        authorId: params.authorId,
        irSnapshot: params.updatedIr as any,
        changeSummary: params.changeSummary,
      });
    } catch (e) {
      console.warn('[Studio DB Save Warning]', e);
    }
  }

  return { success: true, newRevisionNumber: nextRevNumber };
}

export async function promoteStudioProjectToWorkspace(params: {
  projectId: string;
  tenantId: string;
  promotedBy: string;
  targetBranch?: string;
}): Promise<{
  success: boolean;
  workspaceProjectId: string;
  changeRequestId: string;
  compiledPagesCount: number;
  drizzleSchemaGenerated: boolean;
}> {
  const existing = await getStudioProjectIr(params.projectId, params.tenantId);
  if (!existing) {
    throw new Error(`Studio project ${params.projectId} not found.`);
  }

  const { meta, ir } = existing;
  const compiled = compileStudioIr(ir);
  const drizzleCode = generateDrizzleSchemaCode(ir.schema);

  // Construct VFS nodes from compilation
  const vfsNodes: any[] = [
    {
      id: 'vfs_studio_schema',
      name: 'schema.ts',
      type: 'file',
      path: '/src/db/studioSchema.ts',
      language: 'typescript',
      content: drizzleCode,
    },
    {
      id: 'vfs_studio_css',
      name: 'studioTheme.css',
      type: 'file',
      path: '/src/studioTheme.css',
      language: 'css',
      content: compiled.themeCssCode,
    },
  ];

  for (const page of compiled.pages) {
    vfsNodes.push({
      id: `vfs_page_${page.pageId}`,
      name: `${page.pageId}.tsx`,
      type: 'file',
      path: page.filePath,
      language: 'typescript',
      content: page.code,
    });
  }

  // Create real workspace project in Code / AI platform
  const wsProj = await createWorkspaceProject({
    title: `[Studio Promoted] ${meta.name}`,
    description: `Promoted from OPROX Studio Phase 1 Visual Builder (Revision ${meta.activeRevisionNumber}).`,
    category: 'Studio Low-Code',
    icon: '🎨',
    vfsNodes,
  });

  const changeRequestId = `cr_studio_${Date.now()}`;

  if (db) {
    try {
      await db.insert(oproxStudioPromotionsTable).values({
        id: `promo_${Date.now()}`,
        tenantId: params.tenantId,
        projectId: params.projectId,
        revisionNumber: meta.activeRevisionNumber,
        targetBranch: params.targetBranch || 'feature/studio-build',
        changeRequestId,
        commitSha: wsProj.id,
        status: 'PROMOTED',
        promotedBy: params.promotedBy,
      });
    } catch (e) {
      console.warn('[Studio DB Promotion Record Warning]', e);
    }
  }

  return {
    success: true,
    workspaceProjectId: wsProj.id,
    changeRequestId,
    compiledPagesCount: compiled.pages.length,
    drizzleSchemaGenerated: drizzleCode.length > 50,
  };
}
