import React from 'react';
import {
  FolderTree,
  Layout,
  Play,
  RotateCcw,
  Sparkles,
  Split,
  Eye,
  Columns,
  Maximize2,
  Terminal,
  Layers,
  ChevronDown,
  GitBranch,
  ShieldCheck,
  Zap,
  PanelLeft,
  PanelRight,
  PanelBottom
} from 'lucide-react';

interface WorkspaceHeaderProps {
  currentProject: string;
  projectsList: string[];
  onSelectProject: (proj: string) => void;
  layoutPreset: 'default' | 'split' | 'focus' | 'full-preview';
  onChangeLayoutPreset: (preset: 'default' | 'split' | 'focus' | 'full-preview') => void;
  showLeftSidebar: boolean;
  onToggleLeftSidebar: () => void;
  showRightSidebar: boolean;
  onToggleRightSidebar: () => void;
  showBottomDrawer: boolean;
  onToggleBottomDrawer: () => void;
  isSplitEditor: boolean;
  onToggleSplitEditor: () => void;
  onRunPipeline: () => void;
  isPipelineRunning: boolean;
  theme?: 'dark' | 'light';
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  currentProject,
  projectsList,
  onSelectProject,
  layoutPreset,
  onChangeLayoutPreset,
  showLeftSidebar,
  onToggleLeftSidebar,
  showRightSidebar,
  onToggleRightSidebar,
  showBottomDrawer,
  onToggleBottomDrawer,
  isSplitEditor,
  onToggleSplitEditor,
  onRunPipeline,
  isPipelineRunning,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs transition-colors select-none ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Left: Project Selector & Panel Layout Quick Toggles */}
      <div className="flex items-center gap-3">
        {/* Multi-Project Selector Dropdown */}
        <div className="relative group">
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
            isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-900'
          }`}>
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <span className="max-w-[160px] truncate">{currentProject}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Project List Dropdown Menu */}
          <div className={`absolute top-full left-0 mt-1 w-64 rounded-xl border p-1 shadow-2xl z-50 hidden group-hover:block ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Switch Open Project
            </div>
            {projectsList.map((p) => (
              <button
                key={p}
                onClick={() => onSelectProject(p)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                  p === currentProject
                    ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <span className="truncate">{p}</span>
                {p === currentProject && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            ))}
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Panel Visibility Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleLeftSidebar}
            title="Toggle Left Explorer Sidebar"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showLeftSidebar
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleBottomDrawer}
            title="Toggle Bottom Terminal & Console"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showBottomDrawer
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <PanelBottom className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleRightSidebar}
            title="Toggle Right AI Chat & Live Preview"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showRightSidebar
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Split Editor Toggle */}
        <button
          onClick={onToggleSplitEditor}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isSplitEditor
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              : 'text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>{isSplitEditor ? 'Dual Editor' : 'Split Editor'}</span>
        </button>
      </div>

      {/* Middle: Layout Presets Switcher */}
      <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-xl border bg-slate-950 border-slate-800">
        {[
          { id: 'default', label: 'Default IDE', icon: <Layout className="w-3.5 h-3.5" /> },
          { id: 'split', label: 'Split View', icon: <Columns className="w-3.5 h-3.5" /> },
          { id: 'focus', label: 'Focus Code', icon: <Maximize2 className="w-3.5 h-3.5" /> },
          { id: 'full-preview', label: 'Live Preview', icon: <Eye className="w-3.5 h-3.5" /> },
        ].map((preset) => (
          <button
            key={preset.id}
            onClick={() => onChangeLayoutPreset(preset.id as any)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              layoutPreset === preset.id
                ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {preset.icon}
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Actions & Pipeline Runner */}
      <div className="flex items-center gap-3">
        {/* Git Branch Indicator */}
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
          <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
          <span>main*</span>
        </div>

        {/* Run Factory Pipeline Button */}
        <button
          onClick={onRunPipeline}
          disabled={isPipelineRunning}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-slate-950" />
          <span>{isPipelineRunning ? 'Running Factory...' : 'Run 18-Stage AST'}</span>
        </button>
      </div>
    </div>
  );
};
