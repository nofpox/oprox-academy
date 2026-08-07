import React, { useState, useEffect } from 'react';
import {
  Rocket,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  Award
} from 'lucide-react';
import { ReleaseCandidate } from '../../types';

interface AiReleaseManagerProps {
  theme?: 'dark' | 'light';
  onDeployRelease?: (release: ReleaseCandidate) => void;
}

export const AiReleaseManager: React.FC<AiReleaseManagerProps> = ({
  theme = 'dark',
  onDeployRelease
}) => {
  const isDark = theme === 'dark';

  const [semverType, setSemverType] = useState<'major' | 'minor' | 'patch'>('minor');
  const [isCreatingRelease, setIsCreatingRelease] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releases, setReleases] = useState<ReleaseCandidate[]>([]);

  const fetchReleaseData = async () => {
    try {
      setError(null);
      const res = await fetch('/api/phase3/release-manager');
      if (res.ok) {
        const data = await res.json();
        if (data.releases) setReleases(data.releases);
      }
    } catch (err: any) {
      setError('Error connecting to release manager API.');
    }
  };

  useEffect(() => {
    fetchReleaseData();
  }, []);

  const currentRelease = releases[0];

  const handleCreateNewRelease = async () => {
    setIsCreatingRelease(true);
    setError(null);
    try {
      const res = await fetch('/api/phase3/release-manager/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semverType })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.releases) setReleases(data.releases);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create release candidate.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating release candidate.');
    } finally {
      setIsCreatingRelease(false);
    }
  };

  const handleCopyNotes = () => {
    if (currentRelease?.releaseNotes) {
      navigator.clipboard.writeText(currentRelease.releaseNotes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTriggerDeploy = async () => {
    setIsDeploying(true);
    setError(null);
    try {
      const res = await fetch('/api/phase3/release-manager/deploy', {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (onDeployRelease && currentRelease) {
          onDeployRelease(currentRelease);
        }
        setReleases((prev) =>
          prev.map((r, i) => (i === 0 ? { ...r, status: 'released' as const } : r))
        );
      } else {
        const data = await res.json();
        setError(data.error || 'Deployment failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error triggering release deployment.');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25">
            <Rocket className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Release Manager & Production Readiness</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Authoritative Release Gate
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real Readiness Scoring • Dynamic SemVer • Real Commit Release Notes • Explicit Provider Guard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
            {(['patch', 'minor', 'major'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSemverType(st)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                  semverType === st ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleCreateNewRelease}
            disabled={isCreatingRelease}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isCreatingRelease ? 'animate-spin' : ''}`} />
            <span>{isCreatingRelease ? 'Synthesizing...' : 'Create Release Candidate'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Readiness Report Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Active Release Version</span>
            <span className="text-xl font-mono font-extrabold text-emerald-400">{currentRelease?.version || 'v1.0.0-rc1'}</span>
          </div>
          <Rocket className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Readiness Index</span>
            <span className="text-2xl font-extrabold text-emerald-400">{currentRelease?.readinessScore ?? 0}/100</span>
          </div>
          <Award className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Production Gate</span>
            <span className={`text-xl font-extrabold ${currentRelease?.goNoGo === 'GO' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentRelease?.goNoGo || 'NO-GO'}
            </span>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <button
            onClick={handleTriggerDeploy}
            disabled={isDeploying || currentRelease?.status === 'released'}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Rocket className={`w-4 h-4 ${isDeploying ? 'animate-spin' : ''}`} />
            <span>{currentRelease?.status === 'released' ? 'RELEASE DEPLOYED TO PROD' : 'DEPLOY RELEASE TO PROD'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Checklist & Release Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployment Checklist */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">Pre-Deployment Checklist</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-2">
            {currentRelease?.checklist.map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs">
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className={`font-mono text-[11px] ${item.completed ? 'text-slate-200' : 'text-amber-300'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Release Notes Markdown */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
              <FileText className="w-4 h-4" /> Synthesized Release Notes ({currentRelease?.version || 'Draft'})
            </span>

            <button
              onClick={handleCopyNotes}
              className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1 border border-slate-800 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Notes'}</span>
            </button>
          </div>

          <textarea
            value={currentRelease?.releaseNotes || ''}
            readOnly
            rows={10}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
