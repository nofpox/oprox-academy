import React from 'react';
import {
  Sparkles,
  Rocket,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Film,
  Building2,
  Key,
  ShieldCheck,
  CreditCard,
  Bot,
  Database,
  ArrowRight,
  Play,
  Star,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { IndustrySolution, SolutionActivityLog } from '../../types';

interface SolutionsHomeProps {
  solutions: IndustrySolution[];
  activityLogs: SolutionActivityLog[];
  onNavigateTab: (tab: 'home' | 'marketplace' | 'launch-center' | 'active-solution' | 'settings-billing', solutionId?: string) => void;
  onToggleInstall: (solutionId: string) => void;
  theme?: 'dark' | 'light';
}

export const SolutionsHome: React.FC<SolutionsHomeProps> = ({
  solutions,
  activityLogs,
  onNavigateTab,
  onToggleInstall,
  theme = 'dark'
}) => {
  const installedSolutions = solutions.filter((s) => s.isInstalled);
  const featuredSolutions = solutions.filter((s) => s.isFeatured);

  const totalMonthlySavings = installedSolutions
    .reduce((acc, s) => acc + parseInt(s.monthlySavings.replace(/[^0-9]/g, '') || '0'), 0)
    .toLocaleString();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film': return <Film className="w-5 h-5" />;
      case 'Building2': return <Building2 className="w-5 h-5" />;
      case 'Key': return <Key className="w-5 h-5" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
      case 'CreditCard': return <CreditCard className="w-5 h-5" />;
      case 'Bot': return <Bot className="w-5 h-5" />;
      case 'Database': return <Database className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Hero Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OPROX Vertical Domain & Industry Solutions Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            Autonomous Enterprise Applications & Vertical Industry Studios
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Deploy specialized domain studios for Media Content Generation, Real Estate Yield Forecasting, Smart Property Operations, and Enterprise ERP with zero-latency execution.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('launch-center')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 cursor-pointer transition-all"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Active Apps</span>
            </button>

            <button
              onClick={() => onNavigateTab('marketplace')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-xs border border-slate-700 cursor-pointer transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
              <span>Explore Marketplace ({solutions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block font-mono">Installed Solutions</span>
          <p className="text-2xl font-black text-white">{installedSolutions.length} Active</p>
          <p className="text-[10px] text-emerald-400 font-mono">Ready for execution</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block font-mono">Total Monthly Savings</span>
          <p className="text-2xl font-black text-emerald-400">${totalMonthlySavings}</p>
          <p className="text-[10px] text-emerald-400 font-mono">Automated ROI metric</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block font-mono">Platform Uptime</span>
          <p className="text-2xl font-black text-white">99.99%</p>
          <p className="text-[10px] text-cyan-400 font-mono">Zero SLA degradation</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 block font-mono">Active User Seats</span>
          <p className="text-2xl font-black text-indigo-400">24 / 50</p>
          <p className="text-[10px] text-indigo-400 font-mono">Enterprise licensed</p>
        </div>
      </div>

      {/* Featured Solutions Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Featured Industry Solutions</span>
            </h2>
            <p className="text-xs text-slate-400">High-impact vertical studios designed for rapid enterprise deployment.</p>
          </div>

          <button
            onClick={() => onNavigateTab('marketplace')}
            className="text-xs font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredSolutions.slice(0, 3).map((sol) => (
            <div
              key={sol.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sol.bannerGradient} flex items-center justify-center text-white shadow-md`}>
                    {getIcon(sol.iconName)}
                  </div>

                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{sol.rating}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                    {sol.category}
                  </span>
                  <h3 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors">
                    {sol.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sol.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {sol.monthlySavings} / mo
                </span>

                <button
                  onClick={() => onNavigateTab('active-solution', sol.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs hover:brightness-110 cursor-pointer transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Launch</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Installed Solutions Grid */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Installed Applications ({installedSolutions.length})</span>
          </h2>

          <button
            onClick={() => onNavigateTab('launch-center')}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Open Launch Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {installedSolutions.map((sol) => (
            <div
              key={sol.id}
              onClick={() => onNavigateTab('active-solution', sol.id)}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer space-y-2 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sol.bannerGradient} flex items-center justify-center text-white`}>
                  {getIcon(sol.iconName)}
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  {sol.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                  {sol.name}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">{sol.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
