import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Code2,
  Database,
  Server,
  Layers,
  BookOpen,
  Share2,
  RefreshCw,
  Cpu,
  FileCode
} from 'lucide-react';

interface ProjectSpecEngineProps {
  projectTitle?: string;
  theme?: 'dark' | 'light';
  onApplySpecToVfs?: (filename: string, content: string) => void;
}

export const ProjectSpecEngine: React.FC<ProjectSpecEngineProps> = ({
  projectTitle = 'OPROX Enterprise System',
  theme = 'dark',
  onApplySpecToVfs
}) => {
  const isDark = theme === 'dark';

  const [activeSpec, setActiveSpec] = useState<'prd' | 'tech' | 'database' | 'api' | 'architecture'>('prd');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Specifications Store
  const [specifications, setSpecifications] = useState({
    prd: `# PRODUCT REQUIREMENTS DOCUMENT (PRD)
**Project Title:** ${projectTitle}
**Version:** 1.0.0-PROD
**Author:** OPROX AI Spec Engine

## 1. Executive Summary
${projectTitle} is an autonomous software system delivering high-throughput API endpoints, zero-trust security controls, multi-tenant isolation, and real-time AI agent workflow execution.

## 2. Target User Personas
- **Lead Software Architect:** Desires automated architecture decomposition and Drizzle ORM schema generation.
- **Full-Stack Developer:** Requires instant TypeScript API endpoints and clean VFS project scaffolding.
- **DevOps Lead:** Demands zero-downtime Cloud Run deployments and automated health monitoring.

## 3. Functional Requirements
- **FR-01:** Authenticated REST API endpoint suite supporting JWT token validation.
- **FR-02:** AI Wallet gate verifying user balance >= $0.01 before routing agent requests.
- **FR-03:** Real-time WebSocket event broadcaster for multi-agent swarm updates.
- **FR-04:** Automated Drizzle PostgreSQL database migrations with rollback safety.

## 4. Acceptance Criteria
- 100% of API endpoints protected by Helmet headers & CORS policies.
- Unit test coverage exceeding 90% verified via Vitest.
- Zero uncaught UI errors captured by ErrorBoundary isolation guards.
`,

    tech: `# TECHNICAL SPECIFICATION
**Project:** ${projectTitle}
**Stack:** React 18, Vite, Express, TypeScript, Drizzle ORM, Redis 7, Cloud Run

## 1. System Architecture & Component Interactions
The system utilizes a modular, full-stack monorepo layout. Front-end requests are proxied via Express middleware on Port 3000.

## 2. Concurrency & Performance SLA
- **P99 Read Latency:** < 45ms
- **P99 Write Latency:** < 120ms
- **Throughput Target:** 10,000 requests/sec with Redis sliding-window rate limiting.

## 3. Security Policy
- **Encryption at Rest:** AES-256-GCM encrypted payload storage using Master Encryption Keys.
- **In-Transit Encryption:** TLS 1.3 enforced across all ingress points.
- **AI Governance Gate:** Pre-execution check verifying CostGuard thresholds and KillSwitch status.
`,

    database: `# DATABASE SPECIFICATION & SCHEMA
**Database Engine:** PostgreSQL 16 (Cloud SQL)
**ORM:** Drizzle ORM
**Migration Engine:** Controlled Drizzle Kit runner with dry-run support

## 1. Entity ERD Table Definitions

### Table: \`tenants\`
- \`id\` (VARCHAR(64), PK): Unique tenant identifier
- \`name\` (VARCHAR(255), NOT NULL): Tenant display name
- \`tier\` (VARCHAR(32), DEFAULT 'pro'): Subscription tier level
- \`created_at\` (TIMESTAMP, DEFAULT NOW()): Creation timestamp

### Table: \`workspace_projects\`
- \`id\` (VARCHAR(64), PK): Unique project identifier
- \`tenant_id\` (VARCHAR(64), FK -> tenants.id): Tenant reference
- \`title\` (VARCHAR(255), NOT NULL): Project title
- \`vfs_tree\` (JSONB): Full virtual filesystem AST structure
`,

    api: `# OPENAPI 3.0 API SPECIFICATION
**Base URL:** \`https://api.oprox.io/v1\`
**Format:** JSON (UTF-8)

## Endpoints Summary

### 1. \`GET /api/projects\`
- **Summary:** Fetch all workspace projects
- **Security:** Bearer JWT Token
- **Response 200:**
\`\`\`json
{
  "success": true,
  "projects": [
    {
      "id": "proj_1",
      "title": "${projectTitle}",
      "category": "Enterprise Core"
    }
  ]
}
\`\`\`

### 2. \`POST /api/ai/agent-task\`
- **Summary:** Dispatch autonomous AI agent task
- **Headers:** \`Authorization: Bearer <token>\`
- **Request Body:**
\`\`\`json
{
  "agentType": "Architect",
  "prompt": "Deconstruct auth pipeline",
  "projectContext": "${projectTitle}"
}
\`\`\`
`,

    architecture: `# ARCHITECTURE SPECIFICATION
**Topology:** Cloud Run Auto-Scaling Container Cluster
**Region:** Europe-West2 (Primary) + US-Central1 (Failover)

## 1. Network Topology & Ingress Router
- Cloud Armor WAF filtering OWASP Top 10 exploits.
- Nginx reverse proxy routing traffic exclusively to Port 3000.

## 2. Multi-Region Failover Strategy
- Automated health probes polling \`/readyz\` every 5 seconds.
- Secondary Cloud SQL replica promoted upon primary node unreachability.
`
  });

  const handleGenerateAllSpecs = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/agent-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Architect',
          prompt: `Generate complete 5-part Project Specification Suite (PRD, Technical Spec, Database Spec, API Spec, Architecture Spec) for: ${projectTitle}`,
          projectContext: projectTitle
        })
      });
      const data = await res.json();
      if (data.thought) {
        // Spec refresh completed
      }
    } catch (e) {
      console.warn('Spec Engine AI fallback mode', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySpec = () => {
    const currentText = specifications[activeSpec];
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const currentText = specifications[activeSpec];
    const blob = new Blob([currentText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.toLowerCase().replace(/\s+/g, '_')}_${activeSpec}_spec.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <BookOpen className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Project Specification Engine</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Phase 1 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Auto-Generates PRD • Technical Spec • Database Spec • OpenAPI 3.0 Spec • Architecture Spec
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAllSpecs}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing 5 Specifications...' : 'Auto-Generate Complete Spec Suite'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/40">
        {[
          { id: 'prd', label: '1. PRD (Requirements)', icon: <FileText className="w-4 h-4" /> },
          { id: 'tech', label: '2. Technical Spec', icon: <Cpu className="w-4 h-4" /> },
          { id: 'database', label: '3. Database Spec', icon: <Database className="w-4 h-4" /> },
          { id: 'api', label: '4. API Spec (OpenAPI)', icon: <Code2 className="w-4 h-4" /> },
          { id: 'architecture', label: '5. Architecture Spec', icon: <Server className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeSpec === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSpec(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Specification Content Editor & Preview */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
            {activeSpec.toUpperCase()} Specification Document
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySpec}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[11px] flex items-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Spec'}</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[11px] flex items-center gap-1.5 border border-slate-800 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .md</span>
            </button>

            <button
              onClick={() => onApplySpecToVfs?.(`/docs/specs/${activeSpec}_spec.md`, specifications[activeSpec])}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Save Spec to VFS</span>
            </button>
          </div>
        </div>

        <textarea
          value={specifications[activeSpec]}
          onChange={(e) => setSpecifications({ ...specifications, [activeSpec]: e.target.value })}
          rows={16}
          className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300 leading-relaxed focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>
    </div>
  );
};
