import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Play,
  Bug,
  Zap,
  Lock,
  Boxes,
  FileCode,
  Sparkles,
  Check,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { CodeReviewFinding } from '../../types';

interface AiCodeReviewerProps {
  theme?: 'dark' | 'light';
  onApplyFixPatch?: (finding: CodeReviewFinding) => void;
}

export const AiCodeReviewer: React.FC<AiCodeReviewerProps> = ({
  theme = 'dark',
  onApplyFixPatch
}) => {
  const isDark = theme === 'dark';

  const [isScanning, setIsScanning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Findings State
  const [findings, setFindings] = useState<CodeReviewFinding[]>([
    {
      id: 'rev_1',
      category: 'Security (OWASP)',
      severity: 'high',
      filePath: 'src/routes/orgRoutes.ts',
      line: 12,
      title: 'Missing Authorization Token Guard in Member Invite Route',
      description: 'POST route endpoint accepts payload without explicitly checking bearer JWT header claims.',
      recommendation: 'Wrap route with authGuard middleware: orgRouter.post(..., authGuard, handler);',
      codeSnippet: `orgRouter.post('/api/organizations/:id/members', async (req, res) => {...})`,
      status: 'open'
    },
    {
      id: 'rev_2',
      category: 'Performance',
      severity: 'medium',
      filePath: 'src/lib/userOrg.ts',
      line: 22,
      title: 'Unindexed Organization Slug Lookup Query',
      description: 'Database query selects organization by slug without unique index on table schema.',
      recommendation: 'Add .unique() index constraint on org slug column in Drizzle schema definition.',
      codeSnippet: `slug: varchar('slug', { length: 255 }).notNull()`,
      status: 'open'
    },
    {
      id: 'rev_3',
      category: 'Type Safety',
      severity: 'low',
      filePath: 'src/components/ai/AutonomousCodeGenerator.tsx',
      line: 45,
      title: 'Implicit Any Casting in File Generator Event Handler',
      description: 'Explicit type parameter should be supplied to event handler state updater.',
      recommendation: 'Use typed callback parameter instead of cast.',
      codeSnippet: `setGenerationType(type.id as any)`,
      status: 'open'
    }
  ]);

  const qualityScore = Math.max(0, 100 - findings.filter(f => f.status === 'open').length * 12);

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };

  const handleFixFinding = (id: string) => {
    setFindings((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const updated = { ...f, status: 'fixed' as const };
          if (onApplyFixPatch) onApplyFixPatch(updated);
          return updated;
        }
        return f;
      })
    );
  };

  const filteredFindings = findings.filter(
    (f) => activeCategory === 'All' || f.category.includes(activeCategory)
  );

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-rose-500/25">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Code Review & Security Audit</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">
                OWASP & Quality Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated 8-Dimensional Code Scan • Security, OWASP, Perf & Accessibility Verification
            </p>
          </div>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-rose-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Workspace...' : 'Run Automated Code Review'}</span>
        </button>
      </div>

      {/* Quality Index Scorebar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Workspace Quality Score</span>
            <span className="text-3xl font-extrabold text-emerald-400">{qualityScore}/100</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            A+
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Open Findings</span>
            <span className="text-2xl font-extrabold text-rose-400">
              {findings.filter((f) => f.status === 'open').length}
            </span>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Resolved Findings</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {findings.filter((f) => f.status === 'fixed').length}
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">OWASP Security Status</span>
            <span className="text-xs font-bold text-emerald-400">PASSED (0 Critical)</span>
          </div>
          <Lock className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60 mb-6">
        {['All', 'Security', 'Performance', 'Bugs', 'Maintainability', 'Type Safety'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.map((finding) => (
          <div
            key={finding.id}
            className={`p-4 rounded-2xl border transition-all ${
              finding.status === 'fixed'
                ? 'bg-slate-900/50 border-slate-800 opacity-60'
                : 'bg-slate-900 border-slate-800 hover:border-rose-500/40'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  finding.severity === 'critical' ? 'bg-rose-500 text-slate-950' :
                  finding.severity === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {finding.severity}
                </span>

                <span className="text-xs font-bold text-slate-200">{finding.title}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">{finding.filePath}:{finding.line}</span>
                {finding.status === 'open' ? (
                  <button
                    onClick={() => handleFixFinding(finding.id)}
                    className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Apply AI Fix Patch</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Fixed
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-2">{finding.description}</p>
            <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-amber-300">
              <span className="text-slate-500 font-bold block text-[10px] uppercase mb-1">Recommendation:</span>
              {finding.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
