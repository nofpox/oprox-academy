import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  FolderTree,
  Terminal,
  Cpu,
  GitBranch,
  Cloud,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { WorkspaceSyncState } from '../../types';

interface LiveWorkspaceSyncProps {
  theme?: 'dark' | 'light';
}

export const LiveWorkspaceSync: React.FC<LiveWorkspaceSyncProps> = ({
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<WorkspaceSyncState>({
    fileState: { totalFiles: 0, dirtyFiles: 0, syncStatus: 'synced' },
    buildState: { status: 'not_built', bundleSize: 'N/A', lastBuildTime: 'N/A' },
    testState: { totalTests: 0, passed: 0, failed: 0, coverage: '0%' },
    gitState: { branch: 'main', commitHash: 'fetching...', uncommittedChanges: 0 },
    deploymentState: { target: 'Google Cloud Run', status: 'NOT_CONFIGURED', health: 'NOT_CONFIGURED', url: 'NOT_CONFIGURED' }
  });

  const fetchSyncState = async () => {
    try {
      setError(null);
      const res = await fetch('/api/phase3/workspace-sync');
      if (res.ok) {
        const data = await res.json();
        if (data.syncState) {
          setSyncState(data.syncState);
        }
      } else {
        setError('Failed to fetch workspace sync state from server.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to workspace sync API.');
    }
  };

  useEffect(() => {
    fetchSyncState();
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/phase3/force-vfs-sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.syncState) {
          setSyncState(data.syncState);
        }
      } else {
        setError('Failed to force VFS sync.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing force VFS sync.');
    } finally {
      setIsSyncing(false);
    }
  };

  const isDeployed = syncState.deploymentState.status !== 'NOT_CONFIGURED';

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/25">
            <RefreshCw className={`w-6 h-6 stroke-[2.2] ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Live Workspace Synchronization</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Authoritative Server Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritative Monitoring: VFS File Count • Build Artifact Size • Vitest Suite • Git HEAD • Deployment Ingress
            </p>
          </div>
        </div>

        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronizing Workspace...' : 'Force VFS Sync Now'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5 Synchronization Grid Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: VFS File State */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" /> VFS File State
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              syncState.fileState.syncStatus === 'synced' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {syncState.fileState.syncStatus.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300">
            <div className="flex justify-between"><span>Total Indexed VFS Files:</span><span className="text-cyan-400 font-bold">{syncState.fileState.totalFiles}</span></div>
            <div className="flex justify-between"><span>Unsaved Dirty Files:</span><span className="text-emerald-400 font-bold">{syncState.fileState.dirtyFiles}</span></div>
          </div>
        </div>

        {/* Module 2: Build State */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" /> Build Engine State
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              syncState.buildState.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {syncState.buildState.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300">
            <div className="flex justify-between"><span>Compiled Bundle Size:</span><span className="text-blue-400 font-bold">{syncState.buildState.bundleSize}</span></div>
            <div className="flex justify-between"><span>Last Build Time:</span><span className="text-slate-400 text-[10px]">{syncState.buildState.lastBuildTime}</span></div>
          </div>
        </div>

        {/* Module 3: Test State */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" /> Vitest Assertion State
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
              {syncState.testState.passed}/{syncState.testState.totalTests} PASSED
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300">
            <div className="flex justify-between"><span>Statement Coverage:</span><span className="text-amber-400 font-bold">{syncState.testState.coverage}</span></div>
            <div className="flex justify-between"><span>Failed Test Cases:</span><span className="text-emerald-400 font-bold">{syncState.testState.failed}</span></div>
          </div>
        </div>

        {/* Module 4: Git Version Control State */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-400" /> Git Repository State
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
              {syncState.gitState.branch}
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs text-slate-300">
            <div className="flex justify-between"><span>Latest Head Hash:</span><span className="text-purple-400 font-bold truncate max-w-[120px]">{syncState.gitState.commitHash}</span></div>
            <div className="flex justify-between"><span>Uncommitted Staged:</span><span className="text-emerald-400 font-bold">{syncState.gitState.uncommittedChanges}</span></div>
          </div>
        </div>

        {/* Module 5: Deployment Target State */}
        <div className="md:col-span-2 lg:col-span-2 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400" /> Cloud Run Container Ingress
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
              isDeployed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <Activity className={`w-3 h-3 ${isDeployed ? 'animate-pulse' : ''}`} /> {syncState.deploymentState.health}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Target Platform</span>
              <span className={isDeployed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{syncState.deploymentState.target}</span>
            </div>
            <div className="truncate max-w-sm">
              <span className="text-slate-500 block text-[10px] uppercase">Ingress Endpoint</span>
              {isDeployed ? (
                <a href={syncState.deploymentState.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline truncate block">
                  {syncState.deploymentState.url}
                </a>
              ) : (
                <span className="text-slate-500 font-mono text-xs">NOT_CONFIGURED</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
