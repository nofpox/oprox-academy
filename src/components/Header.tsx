import React from 'react';
import { 
  Terminal, 
  Layers, 
  Database, 
  Cloud, 
  Cpu, 
  Film, 
  Building2, 
  Sparkles, 
  Zap,
  Palette,
  Sun,
  Moon,
  LayoutDashboard,
  ShoppingBag,
  Sliders,
  Search,
  Bell,
  Settings,
  FolderKanban,
  GraduationCap
} from 'lucide-react';
import { AppMode } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  serverOnline: boolean;
  activeProjectTitle: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenNotifications?: () => void;
  onOpenProjectManager?: () => void;
  onOpenUserSettings?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  serverOnline,
  activeProjectTitle,
  theme = 'dark',
  onToggleTheme,
  onOpenCommandPalette,
  onOpenNotifications,
  onOpenProjectManager,
  onOpenUserSettings,
  unreadNotificationsCount = 3,
}) => {
  const isDark = theme === 'dark';

  const modes: { id: AppMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, badge: 'HQ' },
    { id: 'oprox-code-ai', label: 'OPROX Code / AI', icon: <Cpu className="w-4 h-4 text-emerald-400" />, badge: 'Phase 1-6' },
    { id: 'studio', label: 'OPROX Studio', icon: <Palette className="w-4 h-4 text-pink-400" />, badge: 'Low-Code' },
    { id: 'real-estate', label: 'OPROX Real Estate', icon: <Building2 className="w-4 h-4 text-amber-400" />, badge: 'Engine' },
    { id: 'academy', label: 'OPROX Academy', icon: <GraduationCap className="w-4 h-4 text-cyan-400" />, badge: 'Phase 1' },
    { id: 'solutions', label: 'Solutions Hub', icon: <ShoppingBag className="w-4 h-4" />, badge: 'Apps' },
    { id: 'platform-suite', label: 'Platform Suite', icon: <Sliders className="w-4 h-4" />, badge: '33 Pages' },
    { id: 'ai-os', label: 'AI Studio OS', icon: <Sparkles className="w-4 h-4" />, badge: 'AI Swarm' },
    { id: 'ide', label: 'OPROX Code (IDE)', icon: <Terminal className="w-4 h-4" />, badge: 'Live OS' },
    { id: 'design-system', label: 'Design System', icon: <Palette className="w-4 h-4" />, badge: 'UI' },
    { id: 'showcase', label: 'Innovation Showcase', icon: <Layers className="w-4 h-4" /> },
    { id: 'database', label: 'Database Studio', icon: <Database className="w-4 h-4" /> },
    { id: 'cloud', label: 'Cloud & Deploy', icon: <Cloud className="w-4 h-4" /> },
    { id: 'enterprise', label: 'Enterprise OS', icon: <Cpu className="w-4 h-4" /> },
    { id: 'media', label: 'Media Studio', icon: <Film className="w-4 h-4" /> },
    { id: 'proptech', label: 'PropTech Vertical', icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 border-b ${
      isDark ? 'bg-slate-950/90 border-slate-800/80 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-[1700px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-slate-950 font-bold stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold text-lg tracking-wider ${
                isDark ? 'bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400' : 'text-slate-900'
              }`}>
                OPROX
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v4.2 OS
              </span>
            </div>
            <p className={`text-[11px] font-medium truncate max-w-[180px] sm:max-w-none ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Autonomous AI Software Platform
            </p>
          </div>
        </div>

        {/* Navigation Mode Switcher Pills */}
        <nav className={`flex items-center gap-1 p-1 rounded-xl border overflow-x-auto max-w-full ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {modes.map((m) => {
            const isActive = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-gradient-to-r from-slate-800 to-slate-800/80 text-white shadow-md border border-slate-700/80 text-emerald-400'
                      : 'bg-white text-emerald-700 shadow-sm border border-emerald-200 font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>{m.icon}</span>
                <span>{m.label}</span>
                {m.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    {m.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Header Action Tools */}
        <div className="flex items-center gap-2">
          {/* Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Command Palette (Ctrl+K)"
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Search...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Project Manager Button */}
          {onOpenProjectManager && (
            <button
              onClick={onOpenProjectManager}
              title="Switch / Create Projects"
              className={`hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
              <span className={`font-semibold truncate max-w-[110px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {activeProjectTitle}
              </span>
            </button>
          )}

          {/* Notification Bell */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              title="Global Notifications"
              className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* User Settings */}
          {onOpenUserSettings && (
            <button
              onClick={onOpenUserSettings}
              title="Platform Settings & Governance"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4 text-indigo-400" />
            </button>
          )}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title="Toggle Light/Dark Theme"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          )}

          {/* Live Status Badge */}
          <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${serverOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${serverOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {serverOnline ? 'AI Factory Live' : 'Simulation'}
            </span>
          </div>

          <button 
            onClick={() => onSelectMode('ide')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:brightness-110 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Launch OPROX Code</span>
          </button>
        </div>
      </div>
    </header>
  );
};
