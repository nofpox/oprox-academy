import React, { useState } from 'react';
import { 
  Cpu, 
  Brain, 
  ShieldAlert, 
  Users, 
  Key, 
  Zap, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertTriangle,
  Code2
} from 'lucide-react';
import { PATTERN_LIBRARY, TECH_DEBT_ITEMS } from '../../data/mockData';

export const EnterpriseOS: React.FC = () => {
  const [copiedPatternId, setCopiedPatternId] = useState<string | null>(null);

  const handleCopyPattern = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPatternId(id);
    setTimeout(() => setCopiedPatternId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>OPROX Enterprise OS & Self-Improving Memory</span>
            </h1>
            <p className="text-xs text-slate-400">
              Pattern library, automated code debt scanner, Role-Based Access Controls (RBAC), and API usage telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            Memory Capacity: 98.4% Efficiency
          </span>
        </div>
      </div>

      {/* Reusable Pattern Library Knowledge Graph */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-400" />
          <span>Learned Reusable Design Patterns</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PATTERN_LIBRARY.map((pat) => (
            <div key={pat.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {pat.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Applied {pat.timesApplied}x
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm">{pat.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{pat.description}</p>
              </div>

              <div className="space-y-2">
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  {pat.codeTemplate}
                </pre>

                <button
                  onClick={() => handleCopyPattern(pat.id, pat.codeTemplate)}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedPatternId === pat.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Pattern</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Pattern Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Debt & Vulnerability Scanner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Technical Debt & Vulnerability Tracker</span>
        </h2>

        <div className="space-y-3">
          {TECH_DEBT_ITEMS.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-white">{item.title}</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {item.severity} severity
                </span>
              </div>

              <p className="text-xs text-slate-300">{item.description}</p>
              <p className="text-[11px] font-mono text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                Fix: {item.suggestedFix}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <span>Role-Based Access Control (RBAC) Permissions</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase">
              <tr>
                <th className="p-3">Role</th>
                <th className="p-3">VFS Write</th>
                <th className="p-3">Run 18-Stage Factory</th>
                <th className="p-3">Database Migrations</th>
                <th className="p-3">Cloud Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              <tr>
                <td className="p-3 font-bold text-white">System Admin</td>
                <td className="p-3 text-emerald-400">✓ Full</td>
                <td className="p-3 text-emerald-400">✓ Full</td>
                <td className="p-3 text-emerald-400">✓ Full</td>
                <td className="p-3 text-emerald-400">✓ Full</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Lead Architect</td>
                <td className="p-3 text-emerald-400">✓ Full</td>
                <td className="p-3 text-emerald-400">✓ Full</td>
                <td className="p-3 text-emerald-400">✓ Full</td>
                <td className="p-3 text-slate-500">- Denied</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-white">Developer / Viewer</td>
                <td className="p-3 text-emerald-400">✓ Branch Only</td>
                <td className="p-3 text-emerald-400">✓ Dry-Run</td>
                <td className="p-3 text-slate-500">- Read Only</td>
                <td className="p-3 text-slate-500">- Denied</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
