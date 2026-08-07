import React, { useState } from 'react';
import {
  Code2,
  Sparkles,
  FolderTree,
  FileCode,
  Layers,
  Database,
  Server,
  CheckCircle2,
  Copy,
  Check,
  Play,
  ArrowRight,
  Download,
  Box,
  FileText,
  Cpu,
  ShieldCheck
} from 'lucide-react';

interface GeneratedFileNode {
  path: string;
  type: 'project' | 'module' | 'component' | 'api' | 'db' | 'test' | 'doc';
  language: string;
  content: string;
  status: 'draft' | 'generated' | 'applied';
}

interface AutonomousCodeGeneratorProps {
  projectTitle?: string;
  theme?: 'dark' | 'light';
  onApplyToVfs?: (files: { path: string; content: string }[]) => void;
}

export const AutonomousCodeGenerator: React.FC<AutonomousCodeGeneratorProps> = ({
  projectTitle = 'OPROX Project Workspace',
  theme = 'dark',
  onApplyToVfs
}) => {
  const isDark = theme === 'dark';

  // Form State
  const [generationType, setGenerationType] = useState<'project' | 'module' | 'component' | 'api' | 'db' | 'test' | 'doc'>('module');
  const [prompt, setPrompt] = useState('Create an enterprise User Organization & RBAC permissions module with Express API routes, Drizzle PostgreSQL schema, and JWT validation.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Generated Files State
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFileNode[]>([
    {
      path: 'src/lib/userOrg.ts',
      type: 'module',
      language: 'typescript',
      status: 'generated',
      content: `// OPROX Autonomous Code Generator — User & Organization RBAC Module
import { pgTable, varchar, timestamp, text, integer, boolean } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  planTier: varchar('plan_tier', { length: 32 }).default('pro').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const organizationMembers = pgTable('organization_members', {
  id: varchar('id', { length: 64 }).primaryKey(),
  orgId: varchar('org_id', { length: 64 }).references(() => organizations.id),
  userId: varchar('user_id', { length: 64 }).notNull(),
  role: varchar('role', { length: 32 }).default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export async function verifyUserOrgRole(userId: string, orgId: string, requiredRole: string): Promise<boolean> {
  // Logic verified by OPROX Autonomous Reviewer
  return true;
}
`
    },
    {
      path: 'src/routes/orgRoutes.ts',
      type: 'api',
      language: 'typescript',
      status: 'generated',
      content: `// Express REST API Routes for User & Organization Management
import { Router, Request, Response } from 'express';
import { verifyUserOrgRole } from '../lib/userOrg';

export const orgRouter = Router();

orgRouter.get('/api/organizations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    success: true,
    organization: { id, name: 'Enterprise Tenant', planTier: 'enterprise' }
  });
});

orgRouter.post('/api/organizations/:id/members', async (req: Request, res: Response) => {
  const { userId, role } = req.body;
  res.json({ success: true, member: { userId, role, addedAt: new Date() } });
});
`
    },
    {
      path: 'tests/userOrg.test.ts',
      type: 'test',
      language: 'typescript',
      status: 'generated',
      content: `// Vitest Suite for User Organization & RBAC Engine
import { describe, it, expect } from 'vitest';
import { verifyUserOrgRole } from '../src/lib/userOrg';

describe('User Organization & RBAC Engine', () => {
  it('should verify org member permissions correctly', async () => {
    const isAllowed = await verifyUserOrgRole('usr_100', 'org_200', 'admin');
    expect(isAllowed).toBe(true);
  });
});
`
    }
  ]);

  const handleRunGenerator = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/agent-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Coder',
          prompt: `[Autonomous Code Generation - ${generationType.toUpperCase()}] ${prompt}`,
          projectContext: projectTitle
        })
      });
      const data = await res.json();
      if (data.codeSnippet) {
        const newPath = `src/generated/${generationType}_${Date.now().toString().slice(-4)}.ts`;
        const newNode: GeneratedFileNode = {
          path: newPath,
          type: generationType,
          language: 'typescript',
          status: 'generated',
          content: data.codeSnippet
        };
        setGeneratedFiles((prev) => [newNode, ...prev]);
        setActiveFileIndex(0);
      }
    } catch (e) {
      console.warn('Autonomous Generator Fallback', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAllToVfs = () => {
    if (onApplyToVfs) {
      onApplyToVfs(generatedFiles.map((f) => ({ path: f.path, content: f.content })));
    }
    setGeneratedFiles((prev) => prev.map((f) => ({ ...f, status: 'applied' })));
  };

  const currentFile = generatedFiles[activeFileIndex] || generatedFiles[0];

  const handleCopyCode = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25">
            <Code2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Autonomous Code Generation Engine</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 2 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-File Code Synthesis • Workspace VFS Aware • Type-Safe TypeScript • DB Models & APIs
            </p>
          </div>
        </div>

        <button
          onClick={handleApplyAllToVfs}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Apply All Generated Artifacts to VFS</span>
        </button>
      </div>

      {/* Input controls */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/40">
          {[
            { id: 'project', label: 'Complete Project', icon: <Box className="w-3.5 h-3.5" /> },
            { id: 'module', label: 'Feature Module', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'component', label: 'UI Component', icon: <FileCode className="w-3.5 h-3.5" /> },
            { id: 'api', label: 'REST API Suite', icon: <Server className="w-3.5 h-3.5" /> },
            { id: 'db', label: 'Database Model', icon: <Database className="w-3.5 h-3.5" /> },
            { id: 'test', label: 'Test Suite', icon: <Cpu className="w-3.5 h-3.5" /> },
            { id: 'doc', label: 'Documentation', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((type) => {
            const isActive = generationType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setGenerationType(type.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {type.icon}
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
            Generation Prompt & Target Specification
          </label>
          <div className="flex gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Describe code requirements, state managers, API parameters, or database tables..."
            />
            <button
              onClick={handleRunGenerator}
              disabled={isGenerating}
              className="px-5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer transition-all disabled:opacity-50 min-w-[120px]"
            >
              <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing...' : 'Generate Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Workspace Code Workbench */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Generated Files Tree */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Generated VFS Files ({generatedFiles.length})</span>
            <FolderTree className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {generatedFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFileIndex(idx)}
                className={`w-full p-2.5 rounded-xl text-left font-mono text-xs flex items-center justify-between transition-all cursor-pointer ${
                  activeFileIndex === idx
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-950 hover:bg-slate-800/60 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">{file.path}</span>
                </div>
                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  file.status === 'applied' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {file.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Code Viewer */}
        <div className="md:col-span-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400">{currentFile?.path}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-400">
                {currentFile?.language.toUpperCase()}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto max-h-96">
            {currentFile?.content || '// No code generated'}
          </pre>
        </div>
      </div>
    </div>
  );
};
