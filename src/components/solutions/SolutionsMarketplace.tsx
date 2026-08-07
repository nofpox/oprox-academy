import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Star,
  Download,
  CheckCircle2,
  Play,
  Film,
  Building2,
  Key,
  ShieldCheck,
  CreditCard,
  Bot,
  Database,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react';
import { IndustrySolution, SolutionCategory } from '../../types';
import { SOLUTION_CATEGORIES } from '../../data/solutionsData';

interface SolutionsMarketplaceProps {
  solutions: IndustrySolution[];
  onToggleInstall: (solutionId: string) => void;
  onLaunchSolution: (solutionId: string) => void;
  theme?: 'dark' | 'light';
}

export const SolutionsMarketplace: React.FC<SolutionsMarketplaceProps> = ({
  solutions,
  onToggleInstall,
  onLaunchSolution,
  theme = 'dark'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredSolutions = solutions.filter((sol) => {
    const matchesCategory = selectedCategory === 'All' || sol.category === selectedCategory;
    const matchesSearch =
      sol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sol.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sol.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header & Search Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">
                OPROX Industry Solutions Marketplace
              </h1>
              <p className="text-xs text-slate-400">
                Discover, install, and deploy enterprise AI modules & vertical domain solutions.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search solutions, tags, AI modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl border font-bold cursor-pointer transition-all whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            All Categories ({solutions.length})
          </button>

          {SOLUTION_CATEGORIES.map((cat) => {
            const count = solutions.filter((s) => s.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Solutions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSolutions.map((sol) => (
          <div
            key={sol.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Top Banner Icon & Rating */}
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sol.bannerGradient} flex items-center justify-center text-white shadow-md`}>
                  {getIcon(sol.iconName)}
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{sol.rating}</span>
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {sol.version}
                  </span>
                </div>
              </div>

              {/* Title & Category */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">
                  {sol.category}
                </span>
                <h3 className="font-extrabold text-base text-white mt-0.5">
                  {sol.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {sol.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sol.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-950 text-slate-400 border border-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics & Install Controls */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block">Estimated Yield</span>
                <strong className="text-emerald-400 font-bold">{sol.monthlySavings} / mo</strong>
              </div>

              <div className="flex items-center gap-2">
                {sol.isInstalled ? (
                  <>
                    <button
                      onClick={() => onLaunchSolution(sol.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Launch</span>
                    </button>

                    <button
                      onClick={() => onToggleInstall(sol.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 font-bold cursor-pointer transition-all text-[11px]"
                      title="Uninstall Solution"
                    >
                      Uninstall
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onToggleInstall(sol.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Install App</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
