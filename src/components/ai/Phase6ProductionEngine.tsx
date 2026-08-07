import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Play,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Box,
  Key,
  RefreshCw,
  Terminal,
  FileCheck,
  Globe,
  Lock,
} from 'lucide-react';

export const Phase6ProductionEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'providers' | 'branches' | 'commits' | 'ci' | 'artifacts' | 'environments' | 'merge'>('providers');

  // Mock initial UI state for high responsiveness
  const [providerStatus, setProviderStatus] = useState<'CONFIGURED' | 'NOT_CONFIGURED'>('CONFIGURED');
  const [gitStatus, setGitStatus] = useState({ isClean: true, currentBranch: 'main', headSha: 'be8dc33' });
  const [runs, setRuns] = useState([
    { id: 'cirun-101', commitSha: 'be8dc33', branchName: 'main', status: 'PASSED', durationMs: 4200 },
  ]);
  const [artifacts, setArtifacts] = useState([
    { name: 'dist-frontend.zip', type: 'frontend_bundle', sha256: 'a3f9104b...881c', size: '1.4 MB' },
  ]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-lg border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Phase 6: Production Repository, CI/CD & Delivery Automation</h2>
            <p className="text-xs text-slate-400">Authoritative Git workflows, CI orchestration, preview environments & governed delivery</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Phase 6 Active
          </span>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-1 overflow-x-auto">
        {[
          { id: 'providers', label: 'Providers & Connections', icon: Key },
          { id: 'branches', label: 'Branches & Working Tree', icon: GitBranch },
          { id: 'commits', label: 'Commits & Provenance', icon: GitCommit },
          { id: 'ci', label: 'CI/CD Pipelines', icon: Terminal },
          { id: 'artifacts', label: 'Build Artifacts & SBOM', icon: Box },
          { id: 'environments', label: 'Cloud & Previews', icon: Server },
          { id: 'merge', label: 'Governed Merge', icon: GitMerge },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {activeTab === 'providers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" /> Repository Provider Connections
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200 text-sm">GitHub Integration</span>
                  <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                    CONFIGURED
                  </span>
                </div>
                <p className="text-xs text-slate-400">Owner: <code className="text-slate-300">oprox-ai</code> | Repo: <code className="text-slate-300">oprox-core</code></p>
                <p className="text-xs text-slate-500 font-mono">Token: ghp_...8821 (Masked)</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200 text-sm">GitLab Integration</span>
                  <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 border border-slate-700 rounded">
                    NOT_CONFIGURED
                  </span>
                </div>
                <p className="text-xs text-slate-400">No GITLAB_TOKEN configured in environment</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" /> Repository Branch Isolation
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-800 pb-2 font-mono">
                <span>Branch Name</span>
                <span>Type</span>
                <span>Head SHA</span>
                <span>Status</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono text-slate-200 py-1">
                <span className="text-indigo-400">main</span>
                <span>release</span>
                <span>be8dc33</span>
                <span className="text-emerald-400">active</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 py-1">
                <span>feature/phase6-delivery</span>
                <span>ai_task</span>
                <span>7c91a02</span>
                <span className="text-emerald-400">active</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commits' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-indigo-400" /> Governed Commit Provenance
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
                <div className="flex justify-between text-xs font-mono text-indigo-400 font-semibold">
                  <span>SHA: be8dc33bc26dbeb48b926350993957f3ba7bdc0c</span>
                  <span className="text-emerald-400">PASSED SECRET SCAN</span>
                </div>
                <p className="text-xs text-slate-300">Author: System Admin (Human-Assisted)</p>
                <p className="text-xs text-slate-400">Risk Level: LOW | Security Status: PASSED</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ci' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> CI/CD Pipeline Runs & Ingestion
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              {runs.map(run => (
                <div key={run.id} className="p-3 bg-slate-900 border border-slate-800 rounded flex justify-between items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-200">{run.id}</span>
                    <p className="text-xs text-slate-400">Branch: {run.branchName} | Commit: {run.commitSha}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                      {run.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{run.durationMs}ms</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'artifacts' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-400" /> Build Artifact Registry & SHA-256 Checksums
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
              {artifacts.map((art, idx) => (
                <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{art.name}</span>
                    <p className="text-slate-400 font-mono">SHA256: {art.sha256}</p>
                  </div>
                  <span className="text-slate-400">{art.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'environments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" /> Ephemeral Preview & Cloud Dev Environments
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-400">
              <p>Cloud Development Environment status: <span className="text-slate-300 font-semibold font-mono">NOT_CONFIGURED (CDE_PROVIDER missing)</span></p>
            </div>
          </div>
        )}

        {activeTab === 'merge' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-indigo-400" /> Governed Merge Eligibility & Delivery Promotion
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Merge Eligibility Check</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold">
                  ELIGIBLE
                </span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                <li>Change Request status: APPROVED</li>
                <li>CI Pipeline: PASSED</li>
                <li>Secret Leakage Guard: PASSED</li>
                <li>KillSwitch status: INACTIVE</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
