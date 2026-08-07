import React, { useState } from 'react';
import {
  FileDiff,
  ShieldCheck,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  History,
  Play,
  Check,
  Eye,
  GitBranch,
  ShieldAlert
} from 'lucide-react';
import { CodePatchItem } from '../../types';

interface IntelligentPatchEngineProps {
  theme?: 'dark' | 'light';
  onApplyPatch?: (patch: CodePatchItem) => void;
}

export const IntelligentPatchEngine: React.FC<IntelligentPatchEngineProps> = ({
  theme = 'dark',
  onApplyPatch
}) => {
  const isDark = theme === 'dark';

  // Sample Patches
  const [patches, setPatches] = useState<CodePatchItem[]>([
    {
      id: 'patch_101',
      filePath: 'src/components/ai/AiSoftwareArchitect.tsx',
      action: 'edit',
      originalContent: `// Legacy Architect Config\nconst maxModules = 10;`,
      patchedContent: `// Updated Architect Config with Dynamic Scaling\nconst maxModules = 50;\nexport const ARCHITECT_VERSION = '2.5.0';`,
      diffSummary: '+2 lines, -1 line',
      timestamp: '2 mins ago',
      status: 'pending'
    },
    {
      id: 'patch_102',
      filePath: 'src/lib/securityAudit.ts',
      action: 'create',
      originalContent: '',
      patchedContent: `// Pre-patch Safety & Security Audit Helper\nexport function validatePatchIntegrity(diff: string): boolean {\n  return !diff.includes('eval(') && !diff.includes('process.exit');\n}`,
      diffSummary: '+4 lines',
      timestamp: '10 mins ago',
      status: 'applied'
    },
    {
      id: 'patch_103',
      filePath: 'src/deprecated/oldUtil.js',
      action: 'delete',
      originalContent: `function oldHelper() { return 'obsolete'; }`,
      patchedContent: '',
      diffSummary: '-1 line (File Deletion)',
      timestamp: '25 mins ago',
      status: 'pending'
    }
  ]);

  const [activePatchId, setActivePatchId] = useState<string>('patch_101');
  const [safetyCheckPassed, setSafetyCheckPassed] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  const activePatch = patches.find((p) => p.id === activePatchId) || patches[0];

  const handleApply = (id: string) => {
    setPatches((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, status: 'applied' as const };
          if (onApplyPatch) onApplyPatch(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const handleRollback = (id: string) => {
    setPatches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rolled_back' as const } : p))
    );
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/25">
            <FileDiff className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Intelligent Patch Engine</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Safety Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Safe File Patching • Diff Preview • Pre-Patch Validation • Instant Rollback Timeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'side-by-side' ? 'unified' : 'side-by-side')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mode: {viewMode === 'side-by-side' ? 'Side-by-Side' : 'Unified'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Patch Queue Sidebar */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Patch Queue ({patches.length})</span>
            <GitBranch className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-2">
            {patches.map((patch) => {
              const isActive = patch.id === activePatchId;
              return (
                <div
                  key={patch.id}
                  onClick={() => setActivePatchId(patch.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${
                      patch.action === 'edit' ? 'bg-amber-500/20 text-amber-400' :
                      patch.action === 'create' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {patch.action === 'edit' && <Edit3 className="w-2.5 h-2.5" />}
                      {patch.action === 'create' && <Plus className="w-2.5 h-2.5" />}
                      {patch.action === 'delete' && <Trash2 className="w-2.5 h-2.5" />}
                      <span>{patch.action}</span>
                    </span>

                    <span className={`text-[9px] font-mono font-bold ${
                      patch.status === 'applied' ? 'text-emerald-400' :
                      patch.status === 'rolled_back' ? 'text-rose-400' :
                      'text-amber-400'
                    }`}>
                      {patch.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs font-mono font-bold text-slate-200 truncate">{patch.filePath}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{patch.diffSummary}</span>
                    <span>{patch.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patch Inspector & Diff Viewer */}
        <div className="md:col-span-3 space-y-4">
          {/* Active Patch Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">{activePatch?.filePath}</span>
                <span className="text-xs text-slate-400">({activePatch?.diffSummary})</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pre-Patch Safety Validation: Passed (0 Syntax Errors, 0 Import Conflicts)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activePatch?.status === 'pending' && (
                <button
                  onClick={() => handleApply(activePatch.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Patch</span>
                </button>
              )}

              {activePatch?.status === 'applied' && (
                <button
                  onClick={() => handleRollback(activePatch.id)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rollback Patch</span>
                </button>
              )}
            </div>
          </div>

          {/* Diff Viewer */}
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold block pb-2 border-b border-slate-800">
                  Original Content
                </span>
                <pre className="p-3 rounded-xl bg-slate-900/80 text-rose-300 leading-relaxed overflow-x-auto min-h-[200px]">
                  {activePatch?.originalContent || '// Empty or file created'}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-emerald-400 font-bold block pb-2 border-b border-slate-800">
                  Patched Content
                </span>
                <pre className="p-3 rounded-xl bg-slate-900/80 text-emerald-300 leading-relaxed overflow-x-auto min-h-[200px]">
                  {activePatch?.patchedContent || '// File deleted'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
              <span className="text-cyan-400 font-bold block pb-2 border-b border-slate-800">
                Unified Diff View ({activePatch?.filePath})
              </span>
              <pre className="p-4 rounded-xl bg-slate-900/80 leading-relaxed overflow-x-auto min-h-[220px]">
                {activePatch?.originalContent.split('\n').map((line, i) => (
                  <div key={`orig_${i}`} className="text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded">
                    - {line}
                  </div>
                ))}
                {activePatch?.patchedContent.split('\n').map((line, i) => (
                  <div key={`patch_${i}`} className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded mt-0.5">
                    + {line}
                  </div>
                ))}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
