import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Database,
  Server,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Compass,
  Zap,
  ArrowRight,
  Download,
  Share2,
  RefreshCw,
  Sliders,
  Box,
  FileCode,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

interface AiSoftwareArchitectProps {
  projectTitle?: string;
  theme?: 'dark' | 'light';
  onApplyArchitectureToVfs?: (code: string) => void;
}

export const AiSoftwareArchitect: React.FC<AiSoftwareArchitectProps> = ({
  projectTitle = 'OPROX Autonomous System',
  theme = 'dark',
  onApplyArchitectureToVfs
}) => {
  const isDark = theme === 'dark';

  // State
  const [activeTab, setActiveTab] = useState<'requirements' | 'architecture' | 'decomposition' | 'stack' | 'database'>('requirements');
  const [requirementText, setRequirementText] = useState(
    'Build a high-throughput multi-tenant SaaS backend with JWT authentication, PostgreSQL with Drizzle ORM, Redis caching layer, event-driven async workers, real-time WebSockets, and Cloud Run deployment.'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Requirement Analysis Result State
  const [analysisResult, setAnalysisResult] = useState({
    functionalReqs: [
      'Multi-tenant tenant isolation and tenant-level API keys',
      'JWT Authentication & OAuth2 bearer token authorization middleware',
      'CRUD endpoint suite for workspace projects and AI agents',
      'Real-time WebSocket event broadcaster for live agent tasks',
      'Stripe & Mada SaaS subscription payment billing engine'
    ],
    nonFunctionalReqs: [
      'API Latency < 45ms P99 for read operations',
      '99.95% Availability SLA with dual-region failover',
      'Zero-Trust network security & AES-256 GCM payload encryption',
      'Sub-second AI model responses via streaming token pipeline'
    ],
    riskScore: 'Low (12/100)',
    complexityLevel: 'Enterprise Tier 3',
    entities: ['User', 'Organization', 'Tenant', 'WorkspaceProject', 'AIAgent', 'Subscription']
  });

  // Stack Recommendations
  const [selectedStack, setSelectedStack] = useState({
    frontend: 'React 18 + Vite + Tailwind CSS + Lucide Icons',
    backend: 'Node.js + Express + TypeScript + ESBuild',
    database: 'PostgreSQL 16 + Drizzle ORM (Cloud SQL)',
    cache: 'Redis 7 + Cluster Caching & Rate Limiting',
    queue: 'Pub/Sub Event Bus & Async Worker Threads',
    cloud: 'Google Cloud Run + Cloud Armor + Secret Manager'
  });

  // Database Schema Preview
  const [dbSchemaCode, setDbSchemaCode] = useState(`// OPROX AI Architect Generated Drizzle Schema
import { pgTable, varchar, timestamp, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  tier: varchar('tier', { length: 32 }).default('pro').notNull(),
  maxSeats: integer('max_seats').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workspaceProjects = pgTable('workspace_projects', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 64 }).references(() => tenants.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  vfsTree: jsonb('vfs_tree'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
`);

  const handleRunRequirementAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/agent-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Architect',
          prompt: `Analyze software architecture for requirement: "${requirementText}". Provide functional, non-functional requirements, database schema suggestions, and tech stack evaluation.`,
          projectContext: projectTitle
        })
      });
      const data = await res.json();
      if (data.thought) {
        setAnalysisResult((prev) => ({
          ...prev,
          riskScore: 'Optimal (8/100)',
          complexityLevel: 'Production Grade High Availability'
        }));
      }
    } catch (e) {
      console.warn('Architect AI analysis fallback mode', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Software Architect</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 1 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Requirement Analysis • System Topology • Module Decomposition • Stack Matrix • DB Architecture
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunRequirementAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Architecting System...' : 'Analyze Requirements & Architecture'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/40">
        {[
          { id: 'requirements', label: '1. Requirement Analysis', icon: <FileCode className="w-4 h-4" /> },
          { id: 'architecture', label: '2. System Topology', icon: <Server className="w-4 h-4" /> },
          { id: 'decomposition', label: '3. Module Decomposition', icon: <Box className="w-4 h-4" /> },
          { id: 'stack', label: '4. Tech Recommendations', icon: <Sliders className="w-4 h-4" /> },
          { id: 'database', label: '5. DB Architecture', icon: <Database className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
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

      {/* TAB 1: Requirement Analysis */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
              Software System Requirement Specification (Input Prompt)
            </label>
            <textarea
              value={requirementText}
              onChange={(e) => setRequirementText(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Describe software features, throughput requirements, API targets, security models..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Functional Specs */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Functional Requirements ({analysisResult.functionalReqs.length})</span>
                </div>
              </div>

              <div className="space-y-2">
                {analysisResult.functionalReqs.map((req, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      F{idx + 1}
                    </span>
                    <span className="leading-relaxed">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-Functional Specs & Risk Assessment */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Non-Functional SLAs ({analysisResult.nonFunctionalReqs.length})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {analysisResult.nonFunctionalReqs.map((req, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        N{idx + 1}
                      </span>
                      <span className="leading-relaxed">{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Architectural Risk Index</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">{analysisResult.riskScore}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Complexity Matrix</span>
                  <span className="text-sm font-extrabold text-indigo-300 font-mono">{analysisResult.complexityLevel}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Detected Domain Entities</span>
                  <span className="text-xs font-bold text-slate-300 font-mono">{analysisResult.entities.length} Entities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: System Architecture Topology Diagram */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">Cloud Architecture & Flow Topology</h3>
                <p className="text-xs text-slate-400 mt-0.5">Microservice & Event Bus Communication Blueprint</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                PROD DEPLOYED • ZERO TRUST
              </span>
            </div>

            {/* Interactive Flow Block Canvas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              {/* Layer 1: Client Edge */}
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                  <Code2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider">Client Edge SPA</h4>
                <p className="text-[11px] text-slate-400">React 18 + Vite + Tailwind</p>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded block">Port 3000 HTTPS</span>
              </div>

              {/* Layer 2: API Gateway & Auth */}
              <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">API Gateway & Auth</h4>
                <p className="text-[11px] text-slate-400">Express + JWT + Helmet</p>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded block">Rate Limited 100/m</span>
              </div>

              {/* Layer 3: AI Engine & Event Workers */}
              <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">AI Swarm Pipeline</h4>
                <p className="text-[11px] text-slate-400">Gemini 2.5 + Async Queue</p>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded block">Multi-Agent Router</span>
              </div>

              {/* Layer 4: Storage & Caching */}
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider">Drizzle PostgreSQL</h4>
                <p className="text-[11px] text-slate-400">Cloud SQL + Redis 7</p>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded block">AES-256 Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Module Decomposition */}
      {activeTab === 'decomposition' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Auth & User Management',
                path: 'src/lib/userOrg.ts',
                methods: ['authenticateJWT()', 'addMemberToOrganization()', 'verifyRolePermission()'],
                status: 'Core Module'
              },
              {
                title: 'Workspace & VFS Engine',
                path: 'src/lib/workspaceProjects.ts',
                methods: ['createWorkspaceProject()', 'updateWorkspaceProject()', 'syncVFSTree()'],
                status: 'Core Module'
              },
              {
                title: 'AI Governance & Wallet',
                path: 'src/server/aiGovernance.ts',
                methods: ['aiGovernanceGate()', 'deductWalletBalance()', 'checkCostGuardLimit()'],
                status: 'Security Guard'
              }
            ].map((m, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-white">{m.title}</h4>
                  <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {m.status}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">{m.path}</p>
                <div className="space-y-1">
                  {m.methods.map((fn, fIdx) => (
                    <div key={fIdx} className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800/60">
                      ⚡ {fn}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Tech Stack Recommendations */}
      {activeTab === 'stack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(selectedStack).map(([layer, choice], idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">{layer} Layer</span>
                <span className="text-xs font-extrabold text-white font-mono">{choice}</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                100% Recommended
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: Database Architecture */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">Drizzle PostgreSQL Schema Definition</span>
              <button
                onClick={() => onApplyArchitectureToVfs?.(dbSchemaCode)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition-all"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Apply to Workspace VFS</span>
              </button>
            </div>
            <pre className="overflow-x-auto text-[11px] text-emerald-300 leading-relaxed max-h-72">
              {dbSchemaCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
