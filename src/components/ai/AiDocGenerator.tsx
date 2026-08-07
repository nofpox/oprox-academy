import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  FolderPlus,
  Eye,
  Download,
  Layers,
  Server,
  FileCheck
} from 'lucide-react';
import { DocArtifact } from '../../types';

interface AiDocGeneratorProps {
  theme?: 'dark' | 'light';
  onSaveDocToVfs?: (doc: DocArtifact) => void;
}

export const AiDocGenerator: React.FC<AiDocGeneratorProps> = ({
  theme = 'dark',
  onSaveDocToVfs
}) => {
  const isDark = theme === 'dark';

  const [activeDocType, setActiveDocType] = useState<DocArtifact['docType']>('readme');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [docs, setDocs] = useState<Record<DocArtifact['docType'], DocArtifact>>({
    readme: {
      id: 'doc_readme',
      docType: 'readme',
      title: 'OPROX Platform README',
      targetPath: 'README.md',
      lastGenerated: 'Just now',
      markdownContent: `# OPROX Code / AI — Enterprise Autonomous Engineering Platform

Welcome to OPROX Code / AI, the world's first AI-native software development lifecycle environment built for enterprise engineering teams.

## 🚀 Key Modules
- **AI Software Architect**: Autonomous requirement analysis, module decomposition, and database topology planning.
- **AI Project Planner**: Task breakdown, dependency graph generation, and sprint planning.
- **AI Agent Orchestrator**: Multi-agent orchestration, agent routing, and task execution pipelines.
- **Autonomous Code Generator**: Workspace-aware production code generation across backend, frontend, APIs, and DB models.
- **Intelligent Patch Engine**: Safe file editing, dry-run previews, pre-patch safety checks, and instant rollbacks.
- **AI Code Reviewer**: Automated 8-dimensional security, OWASP, and performance auditing.
- **AI Test Generator**: Vitest, REST API, integration, and edge-case test suite generation.
- **AI Documentation Suite**: Automated README, API Spec, Architecture, and Deployment docs.

## 🛠️ Quick Start
\`\`\`bash
# Install dependencies
npm install

# Run dev server with OPROX AI Backend
npm run dev
\`\`\`
`
    },
    api: {
      id: 'doc_api',
      docType: 'api',
      title: 'REST API Specification',
      targetPath: 'docs/API_SPECIFICATION.md',
      lastGenerated: 'Just now',
      markdownContent: `# OPROX Code / AI — API Specification

## 1. Agent Task Endpoint
\`\`\`http
POST /api/ai/agent-task
Content-Type: application/json
\`\`\`

### Request Body
\`\`\`json
{
  "agentType": "Coder | Reviewer | Architect | Planner | Tester | DevOps",
  "prompt": "Your engineering task description",
  "projectContext": "Workspace state summary"
}
\`\`\`

### Response
\`\`\`json
{
  "success": true,
  "agentType": "Coder",
  "codeSnippet": "// Generated code artifact...",
  "explanation": "Summary of operations executed"
}
\`\`\`
`
    },
    architecture: {
      id: 'doc_arch',
      docType: 'architecture',
      title: 'Technical Architecture Specification',
      targetPath: 'docs/ARCHITECTURE.md',
      lastGenerated: 'Just now',
      markdownContent: `# OPROX Code / AI — Technical Architecture

## Overview
OPROX Code / AI operates on an event-driven agentic framework that connects client workspace Virtual File Systems (VFS) to server-side Gemini 2.5 Flash agents guarded by AI Wallet and CostGuard engines.

## Core Pipelines
1. **Request Ingestion**: User prompts enter through the OproxCodeAiSuite dashboard.
2. **Role Routing**: Classified into Planner, Architect, Coder, Reviewer, Tester, or DevOps.
3. **Execution Engine**: Code is synthesized or patched with pre-flight AST validation.
4. **VFS Synchronization**: Artifacts are staged in the workspace file system with rollback capabilities.
`
    },
    deployment: {
      id: 'doc_deploy',
      docType: 'deployment',
      title: 'Deployment & Cloud Run Guide',
      targetPath: 'docs/DEPLOYMENT.md',
      lastGenerated: 'Just now',
      markdownContent: `# OPROX Code / AI — Production Deployment Guide

## Cloud Run & Container Configuration
- **Port**: 3000 (Internal proxy binding)
- **Host**: 0.0.0.0
- **Start Command**: \`node dist/server.cjs\`

\`\`\`bash
# Production Build
npm run build

# Production Start
npm start
\`\`\`
`
    },
    changelog: {
      id: 'doc_change',
      docType: 'changelog',
      title: 'Platform Changelog',
      targetPath: 'CHANGELOG.md',
      lastGenerated: 'Just now',
      markdownContent: `# OPROX Code / AI — Changelog

## [2.5.0] - Phase 2 Autonomous Engineering Suite
### Added
- Autonomous Code Generation Engine (Projects, Modules, Components, APIs, DBs).
- Intelligent Patch Engine with side-by-side diffs and instant rollback.
- Workspace Code Intelligence with symbol indexing and cross-reference navigation.
- AI Code Reviewer with OWASP security and performance auditing.
- AI Test Generator for Vitest and integration testing.
- AI Documentation Generator for automatic technical documentation.
`
    },
    release_notes: {
      id: 'doc_release',
      docType: 'release_notes',
      title: 'Phase 2 Release Notes',
      targetPath: 'docs/RELEASE_NOTES.md',
      lastGenerated: 'Just now',
      markdownContent: `# OPROX Code / AI — Phase 2 Official Release Notes

Phase 2 elevates OPROX Code / AI from a software planning tool into a complete autonomous AI engineering environment. Developers can now generate production modules, patch code safely with diff previews, index symbols across large workspaces, run security reviews, and synthesize comprehensive test and documentation suites automatically.
`
    }
  });

  const currentDoc = docs[activeDocType];

  const handleGenerateDoc = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDoc.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToVfs = () => {
    if (onSaveDocToVfs) onSaveDocToVfs(currentDoc);
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 flex items-center justify-center text-slate-950 shadow-lg shadow-purple-500/25">
            <BookOpen className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Documentation Suite Generator</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Markdown Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated Generation for README, API Spec, Architecture, Deployment & Changelogs
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveToVfs}
          className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Save Current Doc to VFS ({currentDoc.targetPath})</span>
        </button>
      </div>

      {/* Doc Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60 mb-6">
        {[
          { id: 'readme', label: 'README.md' },
          { id: 'api', label: 'API Specification' },
          { id: 'architecture', label: 'Architecture Doc' },
          { id: 'deployment', label: 'Deployment Guide' },
          { id: 'changelog', label: 'Changelog' },
          { id: 'release_notes', label: 'Release Notes' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveDocType(item.id as any)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeDocType === item.id
                ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Doc Viewer */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono font-bold text-slate-200">{currentDoc.targetPath}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDoc}
              disabled={isGenerating}
              className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-purple-300 font-bold text-xs flex items-center gap-1 border border-slate-800 transition-all cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1 border border-slate-800 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={currentDoc.markdownContent}
          onChange={(e) =>
            setDocs((prev) => ({
              ...prev,
              [activeDocType]: { ...prev[activeDocType], markdownContent: e.target.value }
            }))
          }
          rows={14}
          className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-purple-200 leading-relaxed focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>
    </div>
  );
};
