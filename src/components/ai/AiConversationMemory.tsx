import React, { useState } from 'react';
import {
  Brain,
  History,
  Sparkles,
  Bookmark,
  GitCommit,
  Layers,
  Database,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  FileText
} from 'lucide-react';
import { MemoryItem } from '../../types';

interface ADRRecord {
  id: string;
  title: string;
  status: 'Accepted' | 'Proposed' | 'Superceded';
  date: string;
  context: string;
  decision: string;
  consequences: string;
}

interface AiConversationMemoryProps {
  projectTitle?: string;
  theme?: 'dark' | 'light';
}

export const AiConversationMemory: React.FC<AiConversationMemoryProps> = ({
  projectTitle = 'OPROX Project Workspace',
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'context' | 'adr' | 'req_history' | 'arch_history' | 'snapshots'>('context');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Memory & Context Store State
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([
    { id: 'mem-1', key: 'Primary Database', value: 'PostgreSQL 16 + Drizzle ORM on Cloud SQL', category: 'Architecture', lastUpdated: '10m ago' },
    { id: 'mem-2', key: 'Authentication Model', value: 'JWT Bearer Tokens + Multi-Tenant Org Isolation', category: 'API Spec', lastUpdated: '1h ago' },
    { id: 'mem-3', key: 'State Management', value: 'React Context API + LocalStorage VFS Persistence', category: 'Convention', lastUpdated: '2h ago' },
    { id: 'mem-4', key: 'AI Governance Policy', value: 'Pre-flight wallet balance check >= $0.01 threshold', category: 'Preference', lastUpdated: '3h ago' }
  ]);

  // Architectural Decision Records (ADRs)
  const [adrRecords, setAdrRecords] = useState<ADRRecord[]>([
    {
      id: 'ADR-001',
      title: 'Adopt Drizzle ORM over Prisma for PostgreSQL',
      status: 'Accepted',
      date: '2026-08-01',
      context: 'Needed lightweight, zero-overhead SQL schema definitions with fast cold starts in Cloud Run containers.',
      decision: 'Selected Drizzle ORM for native TypeScript type-safety and raw SQL query speed.',
      consequences: 'Requires explicit schema migrations via drizzle-kit.'
    },
    {
      id: 'ADR-002',
      title: 'Enforce ESBuild CJS Bundling for Production Backend',
      status: 'Accepted',
      date: '2026-08-02',
      context: 'Node ESM relative imports caused resolution errors when deployed to Cloud Run.',
      decision: 'Bundled server.ts to single dist/server.cjs using esbuild with --packages=external.',
      consequences: 'Eliminated runtime import failures completely.'
    },
    {
      id: 'ADR-003',
      title: 'Implement Server-Side Gemini API Proxy with Governance Gate',
      status: 'Accepted',
      date: '2026-08-03',
      context: 'Client-side API keys expose credentials in browser dev tools.',
      decision: 'Routed all Gemini requests through Express /api/ai/agent-task protected by CostGuard and AI Wallet.',
      consequences: '100% credential security guaranteed.'
    }
  ]);

  // Session Snapshots
  const [snapshots, setSnapshots] = useState([
    { id: 'snap-1', title: 'Phase 1 Core Security Architecture Snapshot', date: 'Today, 10:30 AM', tokenCount: 14200 },
    { id: 'snap-2', title: 'Drizzle PostgreSQL & Auth Middleware Baseline', date: 'Yesterday, 04:15 PM', tokenCount: 9800 }
  ]);

  const handleAddMemoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValue) return;
    const item: MemoryItem = {
      id: 'mem-' + Date.now(),
      key: newKey,
      value: newValue,
      category: 'Convention',
      lastUpdated: 'Just now'
    };
    setMemoryItems((prev) => [item, ...prev]);
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
            <Brain className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Conversation Memory & Context Hub</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Phase 1 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent Project Context • Architectural Decisions (ADR) • Requirement Log • Session Snapshots
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/40">
        {[
          { id: 'context', label: '1. Persistent Context', icon: <Database className="w-4 h-4" /> },
          { id: 'adr', label: '2. Decision History (ADR)', icon: <GitCommit className="w-4 h-4" /> },
          { id: 'req_history', label: '3. Requirement Log', icon: <FileText className="w-4 h-4" /> },
          { id: 'arch_history', label: '4. Architecture Log', icon: <Layers className="w-4 h-4" /> },
          { id: 'snapshots', label: '5. Conversation Snapshots', icon: <Bookmark className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
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

      {/* TAB 1: Persistent Project Context */}
      {activeTab === 'context' && (
        <div className="space-y-6">
          <form onSubmit={handleAddMemoryItem} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Memory Key (e.g. Cache TTL)"
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 w-full md:w-1/3 focus:outline-none focus:border-violet-500"
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Memory Value (e.g. 3600 seconds)"
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 w-full md:w-1/2 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoryItems.map((mem) => (
              <div key={mem.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{mem.key}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {mem.category}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    {mem.value}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">{mem.lastUpdated}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Architectural Decision Records (ADR) */}
      {activeTab === 'adr' && (
        <div className="space-y-4">
          {adrRecords.map((adr) => (
            <div key={adr.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-violet-400">{adr.id}</span>
                  <h3 className="text-sm font-extrabold text-white">{adr.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{adr.date}</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {adr.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Context</span>
                  <p className="text-slate-300 leading-relaxed">{adr.context}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Decision</span>
                  <p className="text-violet-300 font-bold leading-relaxed">{adr.decision}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Consequences</span>
                  <p className="text-slate-400 leading-relaxed">{adr.consequences}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Requirement History */}
      {activeTab === 'req_history' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
          <h3 className="text-sm font-extrabold text-white">Requirement Evolution & Delta Log</h3>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-emerald-400 font-bold">[ADDED] FR-04:</span> AI Wallet balance requirement enforced across all Gemini AI operations.
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-violet-400 font-bold">[MODIFIED] FR-01:</span> Upgraded auth scheme to include JWT bearer headers on REST routes.
          </div>
        </div>
      )}

      {/* TAB 4: Architecture History */}
      {activeTab === 'arch_history' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
          <h3 className="text-sm font-extrabold text-white">System Topology Revision History</h3>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-indigo-400 font-bold">Rev 2.0 (Current):</span> Microservices with Redis 7 caching and Drizzle PostgreSQL schema.
          </div>
        </div>
      )}

      {/* TAB 5: Session Snapshots */}
      {activeTab === 'snapshots' && (
        <div className="space-y-3">
          {snapshots.map((snap) => (
            <div key={snap.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">{snap.title}</h4>
                <span className="text-[10px] font-mono text-slate-400">{snap.date} • {snap.tokenCount} Tokens</span>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Context</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
