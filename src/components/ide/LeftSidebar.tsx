import React, { useState } from 'react';
import {
  FolderTree,
  GitBranch,
  Database,
  Cloud,
  Activity,
  Search,
  Plus,
  Trash2,
  FileCode,
  Folder,
  ChevronRight,
  ChevronDown,
  Check,
  RotateCcw,
  Play,
  Server,
  Globe,
  HardDrive,
  Cpu,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { VFSTree } from './VFSTree';
import { VFSNode } from '../../types';

interface LeftSidebarProps {
  vfsNodes: VFSNode[];
  activePath: string | null;
  onSelectFile: (node: VFSNode) => void;
  onCreateNode: (parentPath: string, name: string, type: 'file' | 'directory') => void;
  onDeleteNode: (path: string) => void;
  theme?: 'dark' | 'light';
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  vfsNodes,
  activePath,
  onSelectFile,
  onCreateNode,
  onDeleteNode,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'explorer' | 'git' | 'database' | 'deployments' | 'monitoring'>('explorer');

  // Git State
  const [commitMessage, setCommitMessage] = useState('');
  const [stagedFiles, setStagedFiles] = useState<string[]>(['/src/App.tsx', '/src/services/aiAgentService.ts']);
  const [commitLogs, setCommitLogs] = useState([
    { hash: 'e9a1f4b', message: 'feat: add 18-stage AST software factory pipeline', author: 'Coder Agent', time: '12m ago' },
    { hash: '7c82b11', message: 'chore: configure esbuild single-file CJS server bundler', author: 'DevOps Agent', time: '1 hour ago' },
    { hash: '3f90a22', message: 'init: bootstrap OPROX Blank Mold architecture VFS', author: 'Architect Agent', time: '2 hours ago' },
  ]);

  // Database State
  const dbTables = [
    { name: 'users', rows: 1420, size: '256 KB' },
    { name: 'projects', rows: 84, size: '64 KB' },
    { name: 'ast_nodes', rows: 12450, size: '2.1 MB' },
    { name: 'telemetry_logs', rows: 84200, size: '14.2 MB' },
  ];
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users WHERE status = "active" LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<string | null>(null);

  const handleRunSql = () => {
    setSqlResult('Query Executed in 1.2ms • 10 rows returned\n[{"id": 101, "role": "Lead Architect", "status": "active"}]');
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    setCommitLogs((prev) => [
      {
        hash: Math.random().toString(16).substring(2, 9),
        message: commitMessage,
        author: 'Lead Architect',
        time: 'Just now'
      },
      ...prev
    ]);
    setCommitMessage('');
    setStagedFiles([]);
  };

  return (
    <div className={`h-full flex flex-col border-r overflow-hidden select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
    }`}>
      {/* Icon Tab Navigation Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 bg-slate-900 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('explorer')}
            title="Project Explorer"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'explorer' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('git')}
            title="Source Control (Git)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'git' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('database')}
            title="Database Studio"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'database' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('deployments')}
            title="Deployments & Cloud Run"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'deployments' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('monitoring')}
            title="Live Telemetry & Monitoring"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'monitoring' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          {activeTab}
        </span>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto">
        
        {/* 1. PROJECT EXPLORER & FILE TREE */}
        {activeTab === 'explorer' && (
          <div className="h-full">
            <VFSTree
              nodes={vfsNodes}
              activePath={activePath}
              onSelectFile={onSelectFile}
              onCreateNode={onCreateNode}
              onDeleteNode={onDeleteNode}
            />
          </div>
        )}

        {/* 2. GIT PANEL */}
        {activeTab === 'git' && (
          <div className="p-3 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono">
                Git Source Control
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Branch: main</span>
            </div>

            {/* Commit Message Box */}
            <div className="space-y-2">
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message (e.g. 'feat: implement AST validation')"
                rows={2}
                className={`w-full p-2 rounded-lg border text-xs focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                onClick={handleCommit}
                className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer transition-colors"
              >
                Commit & Push
              </button>
            </div>

            {/* Staged Changes List */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                Staged Changes ({stagedFiles.length})
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                {stagedFiles.map((file) => (
                  <div key={file} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300 truncate">{file}</span>
                    <span className="text-emerald-400 font-bold">M</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Commits */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                Commit History
              </span>
              <div className="space-y-2">
                {commitLogs.map((c) => (
                  <div key={c.hash} className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">{c.hash}</span>
                      <span className="text-slate-500">{c.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium leading-tight">{c.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">{c.author}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. DATABASE STUDIO PANEL */}
        {activeTab === 'database' && (
          <div className="p-3 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono">
                PostgreSQL Schema Studio
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Connected</span>
            </div>

            {/* Tables List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Tables ({dbTables.length})</span>
              {dbTables.map((t) => (
                <div key={t.name} className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono font-bold text-slate-200">{t.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{t.rows} rows</span>
                </div>
              ))}
            </div>

            {/* SQL Console Simulator */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Interactive SQL Console</span>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                className="w-full p-2 rounded-lg border border-slate-800 bg-slate-900 text-emerald-400 font-mono text-[11px] focus:outline-none"
              />
              <button
                onClick={handleRunSql}
                className="w-full py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold cursor-pointer border border-amber-500/30"
              >
                Execute Query
              </button>

              {sqlResult && (
                <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
                  {sqlResult}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* 4. DEPLOYMENTS PANEL */}
        {activeTab === 'deployments' && (
          <div className="p-3 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono">
                Cloud Run Revisions
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Traffic Live
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">oprox-applet-v2.4.1</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] font-mono text-slate-400 truncate">https://ais-dev-ipdlb.run.app</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>Port: 3000 (0.0.0.0)</span>
                <span>Region: europe-west2</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Previous Revisions</span>
              <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="p-2 rounded bg-slate-900/40 border border-slate-800 flex justify-between">
                  <span>oprox-applet-v2.4.0</span>
                  <span className="text-slate-500">Rolled Back</span>
                </div>
                <div className="p-2 rounded bg-slate-900/40 border border-slate-800 flex justify-between">
                  <span>oprox-applet-v2.3.9</span>
                  <span className="text-slate-500">Archived</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. MONITORING PANEL */}
        {activeTab === 'monitoring' && (
          <div className="p-3 space-y-4 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono block">
              Telemetry & Live Metrics
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">CPU Usage</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">14.2%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">RAM Heap</span>
                <span className="text-lg font-bold text-indigo-400 font-mono">184 MB</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">P99 Latency</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">12 ms</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Sockets</span>
                <span className="text-lg font-bold text-amber-400 font-mono">42 Active</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
