import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Ruler, 
  Grid, 
  BoxSelect, 
  Sun, 
  Moon, 
  Check, 
  Copy, 
  Search, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  SlidersHorizontal, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  MoreHorizontal, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  Download, 
  Play, 
  Terminal, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Code2, 
  Layout, 
  RefreshCw, 
  Sparkles, 
  ExternalLink,
  Lock,
  Mail,
  User,
  Bell,
  Settings,
  HelpCircle,
  FileText
} from 'lucide-react';

interface DesignSystemViewProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const DesignSystemView: React.FC<DesignSystemViewProps> = ({
  theme,
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'typography'
    | 'colors'
    | 'spacing'
    | 'buttons'
    | 'inputs'
    | 'cards'
    | 'tables'
    | 'feedback'
    | 'overlays'
    | 'navigation'
    | 'skeletons'
  >('overview');

  // Component State Demos
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [textInputValue, setTextInputValue] = useState('Google AI Studio Inspired Workspace');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('SecretKey2026!');
  const [checkboxState, setCheckboxState] = useState(true);
  const [radioValue, setRadioValue] = useState('option-1');
  const [switchState, setSwitchState] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('OPROX Autonomous Agent');
  
  // Interactive Modal & Drawer Demos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Tabs demo
  const [demoTab, setDemoTab] = useState<'overview' | 'settings' | 'logs'>('overview');
  const [segmentedTab, setSegmentedTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Table State Demo
  const [tableSearch, setTableSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>(['1']);
  const [tableSort, setTableSort] = useState<'asc' | 'desc'>('asc');

  // Alert Dismiss Demos
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

  const isDark = theme === 'dark';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const sampleTableData = [
    { id: '1', name: 'Planner Agent', role: 'System Architect', status: 'Active', latency: '12ms', coverage: '98.4%' },
    { id: '2', name: 'Coder Agent', role: 'AST Synthesizer', status: 'Running', latency: '24ms', coverage: '94.2%' },
    { id: '3', name: 'Reviewer Agent', role: 'Security Auditor', status: 'Idle', latency: '8ms', coverage: '99.1%' },
    { id: '4', name: 'DevOps Agent', role: 'Cloud Run Deployer', status: 'Active', latency: '16ms', coverage: '97.8%' },
  ];

  const filteredTableData = sampleTableData.filter(row => 
    row.name.toLowerCase().includes(tableSearch.toLowerCase()) || 
    row.role.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className={`space-y-8 pb-16 transition-colors duration-200 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Design System Header & Theme Switcher */}
      <div className={`p-6 rounded-2xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Palette className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">OPROX Global Design System</h1>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Phase 3 Specs
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Google AI Studio-inspired visual architecture with crisp typography, mathematical spacing, and dual Light/Dark theme support.
            </p>
          </div>
        </div>

        {/* Global Light / Dark Theme Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span>Switch to Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
                <span>Switch to Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Design System Categories */}
      <div className={`p-1.5 rounded-2xl border overflow-x-auto flex items-center gap-1 max-w-full scrollbar-none ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        {[
          { id: 'overview', label: '1. Overview & Tokens', icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'typography', label: '2. Typography', icon: <Type className="w-3.5 h-3.5" /> },
          { id: 'colors', label: '3. Colors & Theme', icon: <Sun className="w-3.5 h-3.5" /> },
          { id: 'spacing', label: '4. Spacing & Grid', icon: <Ruler className="w-3.5 h-3.5" /> },
          { id: 'buttons', label: '5. Buttons & Controls', icon: <Zap className="w-3.5 h-3.5" /> },
          { id: 'inputs', label: '6. Inputs & Selects', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
          { id: 'cards', label: '7. Cards & Layouts', icon: <Layout className="w-3.5 h-3.5" /> },
          { id: 'tables', label: '8. Tables & Data', icon: <Code2 className="w-3.5 h-3.5" /> },
          { id: 'feedback', label: '9. Alerts & Badges', icon: <AlertCircle className="w-3.5 h-3.5" /> },
          { id: 'overlays', label: '10. Modals & Drawers', icon: <BoxSelect className="w-3.5 h-3.5" /> },
          { id: 'navigation', label: '11. Tabs & Nav', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'skeletons', label: '12. Loading & Skeletons', icon: <RefreshCw className="w-3.5 h-3.5" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'bg-white text-emerald-700 border border-emerald-300 shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-lg font-bold mb-2">Design System Architecture</h2>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              The OPROX design system provides a comprehensive set of tokens, primitives, and complex interactive components built for high-density, high-performance developer platforms. Inspired by Google AI Studio, it prioritizes optical clarity, minimal visual clutter, and seamless Dark/Light context switching.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-bold text-emerald-500 font-mono">1. Math Scale</span>
                <p className="font-bold text-sm mt-1">4px Spacing Rhythm</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Strict grid alignment across paddings, margins, and component heights.</p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-bold text-teal-500 font-mono">2. Typography</span>
                <p className="font-bold text-sm mt-1">Plus Jakarta & Mono</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>High contrast display scale paired with code-grade JetBrains Mono.</p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-bold text-indigo-500 font-mono">3. Dual Theme</span>
                <p className="font-bold text-sm mt-1">Light & Dark Modes</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full token switching without hardcoded single-mode gray scales.</p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] uppercase font-bold text-amber-500 font-mono">4. Zero External API</span>
                <p className="font-bold text-sm mt-1">Mock Data Engine</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fully self-contained interactive components ready for immediate deployment.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TYPOGRAPHY */}
      {activeTab === 'typography' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between border-b pb-4 border-slate-800/40">
            <div>
              <h2 className="text-lg font-bold">Typography Scale</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Plus Jakarta Sans for display and body text; JetBrains Mono for code elements.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-500">Display 1 — 32px / Bold</span>
              <p className="text-3xl font-extrabold tracking-tight">OPROX Autonomous Engine</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-teal-500">Heading 1 (H1) — 24px / Bold</span>
              <h1 className="text-2xl font-bold tracking-tight">Software Factory Pipeline 18-Stage Execution</h1>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-indigo-500">Heading 2 (H2) — 20px / SemiBold</span>
              <h2 className="text-xl font-semibold tracking-tight">Multi-Agent System Architecture</h2>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-cyan-500">Heading 3 (H3) — 16px / SemiBold</span>
              <h3 className="text-base font-semibold">Virtual File System (VFS) State Node</h3>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">Body Medium (14px / Regular)</span>
              <p className="text-sm leading-relaxed">
                The software factory orchestrates specialized agents that analyze requirements, draft formal specifications, synthesize TypeScript AST code, and verify migration locks.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500">Body Small (12px / Regular)</span>
              <p className="text-xs leading-relaxed">
                Compact UI text used for secondary descriptions, card subtitles, and table metadata cells.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-amber-500">Code / Terminal Mono (12px / JetBrains Mono)</span>
              <p className="text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400">
                {`const pipeline = new OproxFactoryPipeline({ stages: 18, autoRemediation: true });`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: COLOR PALETTE & THEME TOKENS */}
      {activeTab === 'colors' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className="text-lg font-bold">Color Tokens & Palette</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Click any color token to copy its hex / Tailwind class to clipboard.</p>
          </div>

          {/* Primary Accents */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary & Brand Accents</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { name: 'Emerald 500', hex: '#10b981', bg: 'bg-emerald-500' },
                { name: 'Teal 600', hex: '#0d9488', bg: 'bg-teal-600' },
                { name: 'Indigo 600', hex: '#4f46e5', bg: 'bg-indigo-600' },
                { name: 'Cyan 500', hex: '#06b6d4', bg: 'bg-cyan-500' },
                { name: 'Amber 500', hex: '#f59e0b', bg: 'bg-amber-500' },
                { name: 'Rose 500', hex: '#f43f5e', bg: 'bg-rose-500' },
              ].map((c) => (
                <div
                  key={c.name}
                  onClick={() => handleCopy(c.hex)}
                  className={`p-3 rounded-xl border cursor-pointer hover:scale-105 transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`h-12 w-full rounded-lg ${c.bg} shadow-inner mb-2`} />
                  <p className="font-bold text-xs">{c.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{c.hex}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Neutral Slate Scale */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Neutral Slate Surface Tokens</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { name: 'Slate 950 (Dark Canvas)', hex: '#020617', bg: 'bg-slate-950' },
                { name: 'Slate 900 (Dark Panel)', hex: '#0f172a', bg: 'bg-slate-900' },
                { name: 'Slate 800 (Dark Border)', hex: '#1e293b', bg: 'bg-slate-800' },
                { name: 'Slate 200 (Light Border)', hex: '#e2e8f0', bg: 'bg-slate-200' },
                { name: 'Slate 100 (Light Panel)', hex: '#f1f5f9', bg: 'bg-slate-100' },
                { name: 'Slate 50 (Light Canvas)', hex: '#f8fafc', bg: 'bg-slate-50' },
              ].map((c) => (
                <div
                  key={c.name}
                  onClick={() => handleCopy(c.hex)}
                  className={`p-3 rounded-xl border cursor-pointer hover:scale-105 transition-all ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`h-12 w-full rounded-lg ${c.bg} border border-slate-700/50 mb-2`} />
                  <p className="font-bold text-xs truncate">{c.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{c.hex}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SPACING, GRID & BORDER RADIUS */}
      {activeTab === 'spacing' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-lg font-bold">4px Base Spacing Rhythm</h2>
            <div className="space-y-3">
              {[
                { label: 'Space 1 (4px)', size: 'h-1 w-16 bg-emerald-500' },
                { label: 'Space 2 (8px)', size: 'h-2 w-24 bg-emerald-500' },
                { label: 'Space 3 (12px)', size: 'h-3 w-32 bg-emerald-500' },
                { label: 'Space 4 (16px)', size: 'h-4 w-40 bg-emerald-500' },
                { label: 'Space 6 (24px)', size: 'h-6 w-56 bg-emerald-500' },
                { label: 'Space 8 (32px)', size: 'h-8 w-72 bg-emerald-500' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4 text-xs font-mono">
                  <span className="w-32 text-slate-400">{s.label}</span>
                  <div className={`${s.size} rounded`} />
                </div>
              ))}
            </div>
          </div>

          {/* Border Radii */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-lg font-bold">Border Radius Scale</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`p-4 border text-center text-xs font-mono rounded-none ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>rounded-none (0px)</div>
              <div className={`p-4 border text-center text-xs font-mono rounded-md ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>rounded-md (6px)</div>
              <div className={`p-4 border text-center text-xs font-mono rounded-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>rounded-xl (12px)</div>
              <div className={`p-4 border text-center text-xs font-mono rounded-2xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>rounded-2xl (16px)</div>
            </div>
          </div>

          {/* Responsive 12-Column Grid Demo */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-lg font-bold">12-Column Responsive Grid</h2>
            <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-center">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="col-span-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                  Col {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: BUTTONS & CONTROLS */}
      {activeTab === 'buttons' && (
        <div className={`p-6 rounded-2xl border space-y-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className="text-lg font-bold">Buttons & Trigger Controls</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Interactive buttons across variants, sizes, and states.</p>
          </div>

          {/* Variants */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Button Variants</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 transition-all shadow-md cursor-pointer">
                Primary Gradient
              </button>

              <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
              }`}>
                Secondary Solid
              </button>

              <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}>
                Outline Button
              </button>

              <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}>
                Ghost Text Button
              </button>

              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow cursor-pointer">
                Danger Action
              </button>

              <button disabled className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed">
                Disabled State
              </button>

              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Loading State...</span>
              </button>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Button Sizes</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <button className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 text-slate-950">
                Small (sm)
              </button>
              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950">
                Medium (md)
              </button>
              <button className="px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-slate-950">
                Large (lg)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: INPUTS & SELECTS */}
      {activeTab === 'inputs' && (
        <div className={`p-6 rounded-2xl border space-y-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className="text-lg font-bold">Form Inputs, Toggles & Selects</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Standardized form components with focus states and error handling.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Text Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold">Standard Text Input</label>
              <input
                type="text"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-all border focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                }`}
              />
            </div>

            {/* Password Input with Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold">Password Input with Toggle</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-all border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox & Radio Controls */}
            <div className="space-y-3">
              <label className="text-xs font-bold">Checkbox & Radio Controls</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkboxState}
                    onChange={(e) => setCheckboxState(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Enable Auto-Remediation</span>
                </label>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="demo-radio"
                      value="option-1"
                      checked={radioValue === 'option-1'}
                      onChange={() => setRadioValue('option-1')}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Option 1</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="demo-radio"
                      value="option-2"
                      checked={radioValue === 'option-2'}
                      onChange={() => setRadioValue('option-2')}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Option 2</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="space-y-2">
              <label className="text-xs font-bold">iOS / Android Style Toggle Switch</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSwitchState(!switchState)}
                  className={`w-11 h-6 rounded-full transition-all relative p-1 cursor-pointer ${
                    switchState ? 'bg-emerald-500' : isDark ? 'bg-slate-800' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-all transform ${
                      switchState ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-medium">{switchState ? 'Active Mode Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: CARDS & LAYOUTS */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature Card */}
            <div className={`p-6 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">Feature Architecture Card</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Clean container card with high-contrast icon badge, title, and body description.
              </p>
            </div>

            {/* Metric KPI Card */}
            <div className={`p-6 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Throughput RPS</p>
              <p className="text-3xl font-black text-emerald-400 font-mono">1,890 /s</p>
              <p className="text-[10px] text-emerald-500 font-bold">↑ +14.2% vs previous run</p>
            </div>

            {/* Code Snippet Card */}
            <div className={`p-6 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">server.ts</span>
                <span className="text-slate-500">Node ESM</span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-teal-300">
                {`app.listen(3000, "0.0.0.0", () => {\n  console.log("Ready");\n});`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: TABLES & DATA */}
      {activeTab === 'tables' && (
        <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Interactive Data Table</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Search, sorting, status badges, and row selection.</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search table rows..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'} uppercase`}>
                <tr>
                  <th className="p-3">Agent Name</th>
                  <th className="p-3">System Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Coverage</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-slate-800'}`}>
                {filteredTableData.map((row) => (
                  <tr key={row.id} className={`hover:bg-slate-800/20`}>
                    <td className="p-3 font-bold">{row.name}</td>
                    <td className="p-3 text-emerald-400">{row.role}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {row.status}
                      </span>
                    </td>
                    <td className="p-3">{row.latency}</td>
                    <td className="p-3">{row.coverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 9: ALERTS, BANNERS & BADGES */}
      {activeTab === 'feedback' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h2 className="text-lg font-bold">Alerts, Banners & Status Badges</h2>

          <div className="space-y-3">
            {/* Success Alert */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span><strong>Build Successful:</strong> All 18 Factory pipeline stages executed with 0 syntax warnings.</span>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span><strong>Migration Warning:</strong> Schema change requires index re-alignment.</span>
              </div>
            </div>

            {/* Error Alert */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span><strong>Runtime Error:</strong> Port 3000 collision resolved by proxy restart.</span>
              </div>
            </div>
          </div>

          {/* Badges Scale */}
          <div className="space-y-3 pt-4 border-t border-slate-800/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Badges & Pill Indicators</h3>
            <div className="flex flex-wrap gap-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ● Live Production
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                ● AST Verified
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                ● Agent Active
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ▲ Pending Approval
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                ✕ Failed Test
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 10: MODALS & DRAWERS */}
      {activeTab === 'overlays' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h2 className="text-lg font-bold">Dialog Modals & Slide-Over Drawers</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Click the buttons below to test live interactive modal dialogs and slide-over side drawers.</p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow"
            >
              Open Interactive Modal Dialog
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-slate-200'
              }`}
            >
              Open Interactive Slide-Over Drawer
            </button>
          </div>

          {/* Modal Demo Overlay */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className={`w-full max-w-md p-6 rounded-2xl border space-y-4 shadow-2xl animate-in fade-in zoom-in-95 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base">Confirm Deployment Release</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Are you sure you want to trigger a Cloud Run production deployment for image sha256:e9a14?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white">
                    Cancel
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950">
                    Confirm & Trigger
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Slide Drawer Overlay */}
          {isDrawerOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
              <div className={`w-full max-w-sm h-full p-6 border-l space-y-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4 border-slate-800">
                    <h3 className="font-bold text-base">Drawer Settings Panel</h3>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Slide-over inspector panel used for active agent telemetries and environment config.</p>
                </div>

                <button onClick={() => setIsDrawerOpen(false)} className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950">
                  Close Drawer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 11: TABS & BREADCRUMBS */}
      {activeTab === 'navigation' && (
        <div className={`p-6 rounded-2xl border space-y-8 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div>
            <h2 className="text-lg font-bold">Tabs & Navigation Breadcrumbs</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Underline tabs, segmented controls, and breadcrumb trails.</p>
          </div>

          {/* Breadcrumbs */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Breadcrumb Navigation Trail</h3>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="hover:text-white cursor-pointer">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="hover:text-white cursor-pointer">src</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="hover:text-white cursor-pointer">services</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-emerald-400 font-bold">aiAgentService.ts</span>
            </div>
          </div>

          {/* Segmented Control Tabs */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Segmented Control Tabs</h3>
            <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
              {['daily', 'weekly', 'monthly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSegmentedTab(t as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    segmentedTab === t ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 12: LOADING & SKELETON LOADERS */}
      {activeTab === 'skeletons' && (
        <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h2 className="text-lg font-bold">Skeleton Loaders & Empty States</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Skeleton */}
            <div className={`p-6 rounded-2xl border space-y-4 animate-pulse ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="w-10 h-10 rounded-xl bg-slate-800" />
              <div className="h-4 w-3/4 rounded bg-slate-800" />
              <div className="h-3 w-1/2 rounded bg-slate-800" />
              <div className="h-12 w-full rounded-xl bg-slate-800" />
            </div>

            {/* Empty State */}
            <div className={`p-8 rounded-2xl border text-center space-y-3 flex flex-col items-center justify-center ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm">No Active Deployments Found</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Launch the 18-stage software factory pipeline to compile and deploy your first cloud instance.
              </p>
              <button className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950">
                Create First Build
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
