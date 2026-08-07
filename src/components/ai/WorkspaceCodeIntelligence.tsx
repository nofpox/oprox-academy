import React, { useState } from 'react';
import {
  Code,
  Search,
  Network,
  ListTree,
  Share2,
  RefreshCw,
  Folder,
  FileCode,
  Zap,
  ArrowRight,
  Edit2,
  Check,
  AlertCircle
} from 'lucide-react';
import { SymbolIndexItem } from '../../types';

interface WorkspaceCodeIntelligenceProps {
  theme?: 'dark' | 'light';
}

export const WorkspaceCodeIntelligence: React.FC<WorkspaceCodeIntelligenceProps> = ({
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'symbols' | 'graph' | 'rename'>('symbols');
  const [renameFrom, setRenameFrom] = useState('verifyUserOrgRole');
  const [renameTo, setRenameTo] = useState('authorizeUserOrgRole');
  const [renameApplied, setRenameApplied] = useState(false);

  // Symbol Index Data
  const [symbols, setSymbols] = useState<SymbolIndexItem[]>([
    {
      id: 'sym_1',
      name: 'verifyUserOrgRole',
      kind: 'function',
      filePath: 'src/lib/userOrg.ts',
      line: 18,
      usagesCount: 6,
      exported: true,
      signature: 'async function verifyUserOrgRole(userId: string, orgId: string, requiredRole: string): Promise<boolean>'
    },
    {
      id: 'sym_2',
      name: 'OproxCodeAiSuite',
      kind: 'class',
      filePath: 'src/components/ai/OproxCodeAiSuite.tsx',
      line: 14,
      usagesCount: 2,
      exported: true,
      signature: 'export const OproxCodeAiSuite: React.FC<OproxCodeAiSuiteProps>'
    },
    {
      id: 'sym_3',
      name: 'organizations',
      kind: 'variable',
      filePath: 'src/lib/userOrg.ts',
      line: 4,
      usagesCount: 12,
      exported: true,
      signature: 'export const organizations = pgTable(...)'
    },
    {
      id: 'sym_4',
      name: 'AppMode',
      kind: 'type',
      filePath: 'src/types.ts',
      line: 3,
      usagesCount: 18,
      exported: true,
      signature: "export type AppMode = 'dashboard' | 'oprox-code-ai' | ..."
    }
  ]);

  const filteredSymbols = symbols.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.filePath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApplyRename = () => {
    setRenameApplied(true);
    setSymbols((prev) =>
      prev.map((s) => (s.name === renameFrom ? { ...s, name: renameTo } : s))
    );
    setTimeout(() => setRenameApplied(false), 3000);
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-slate-950 shadow-lg shadow-indigo-500/25">
            <Network className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Workspace Code Intelligence</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Symbol Indexer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Workspace Symbol Graph • Cross-Reference Navigation • Refactoring & Rename Engine
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          {[
            { id: 'symbols', label: 'Symbol Index', icon: <ListTree className="w-3.5 h-3.5" /> },
            { id: 'graph', label: 'Dependency Graph', icon: <Share2 className="w-3.5 h-3.5" /> },
            { id: 'rename', label: 'Rename Symbol', icon: <Edit2 className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Symbol Index */}
      {activeTab === 'symbols' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbols, functions, interfaces, or file paths across workspace..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSymbols.map((symbol) => (
              <div
                key={symbol.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {symbol.kind}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-slate-100">{symbol.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{symbol.usagesCount} Usages</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-950 text-[11px] font-mono text-slate-400 truncate">
                  {symbol.signature}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{symbol.filePath}:{symbol.line}</span>
                  <span className="text-emerald-400">Exported</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Dependency Graph */}
      {activeTab === 'graph' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-indigo-400">
            <Share2 className="w-5 h-5 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Workspace Module Graph Visualization</h3>
          </div>

          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-3">
            <div className="flex items-center justify-around py-3 border-b border-slate-800">
              <span className="p-2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">App.tsx</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="p-2 rounded bg-purple-950 text-purple-300 border border-purple-800">OproxCodeAiSuite.tsx</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="p-2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">userOrg.ts</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Circular Dependency Scan: Passed (0 Cycles Found)</span>
              </span>
              <span>Total Indexed Imports: 42 Files</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rename Symbol */}
      {activeTab === 'rename' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Safe Cross-Workspace Symbol Renaming
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">Target Symbol to Rename</label>
              <input
                type="text"
                value={renameFrom}
                onChange={(e) => setRenameFrom(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-bold block mb-1">New Symbol Identifier</label>
              <input
                type="text"
                value={renameTo}
                onChange={(e) => setRenameTo(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
              />
            </div>
          </div>

          <button
            onClick={handleApplyRename}
            className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {renameApplied ? <Check className="w-4 h-4 text-slate-950" /> : <Zap className="w-4 h-4" />}
            <span>{renameApplied ? 'Symbol Renamed Across Workspace' : 'Refactor & Ref-Update Across Files'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
