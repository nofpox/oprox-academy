import React from 'react';
import {
  Rocket,
  Play,
  Film,
  Building2,
  Key,
  ShieldCheck,
  CreditCard,
  Bot,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { IndustrySolution } from '../../types';

interface LaunchCenterProps {
  solutions: IndustrySolution[];
  onLaunchSolution: (solutionId: string) => void;
  theme?: 'dark' | 'light';
}

export const LaunchCenter: React.FC<LaunchCenterProps> = ({
  solutions,
  onLaunchSolution,
  theme = 'dark'
}) => {
  const installedSolutions = solutions.filter((s) => s.isInstalled);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film': return <Film className="w-6 h-6" />;
      case 'Building2': return <Building2 className="w-6 h-6" />;
      case 'Key': return <Key className="w-6 h-6" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6" />;
      case 'CreditCard': return <CreditCard className="w-6 h-6" />;
      case 'Bot': return <Bot className="w-6 h-6" />;
      case 'Database': return <Database className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>OPROX Launch Center</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Instantly Active
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              One-click autonomous execution launchpad for installed industry applications & AI studios.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">Installed Apps:</span>
          <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
            {installedSolutions.length} / {solutions.length}
          </span>
        </div>
      </div>

      {/* Grid of Installed Applications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {installedSolutions.map((sol) => (
          <div
            key={sol.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sol.bannerGradient} flex items-center justify-center text-white shadow-md`}>
                  {getIcon(sol.iconName)}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
                    {sol.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors">
                  {sol.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sol.tagline}
                </p>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sol.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Launch Button Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-mono">
                <span>Active Users: </span>
                <strong className="text-slate-200">{sol.activeUsers}</strong>
              </div>

              <button
                onClick={() => onLaunchSolution(sol.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 font-extrabold text-xs shadow-md hover:brightness-110 cursor-pointer transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Launch App</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
