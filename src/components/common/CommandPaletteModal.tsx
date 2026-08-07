import React, { useState, useEffect } from 'react';
import { Search, Command, Terminal, Database, Cloud, Sparkles, Layers, Sliders, Moon, Sun, Plus, ArrowRight, X, GraduationCap } from 'lucide-react';
import { AppMode } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateMode: (mode: AppMode) => void;
  onToggleTheme: () => void;
  onOpenNewProject: () => void;
  theme?: 'dark' | 'light';
}

interface CommandOption {
  id: string;
  category: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateMode,
  onToggleTheme,
  onOpenNewProject,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');

  // Keyboard Event Listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: CommandOption[] = [
    {
      id: 'cmd-ide',
      category: 'Navigation',
      label: 'Open OPROX Code (IDE)',
      shortcut: 'Ctrl+Shift+I',
      icon: <Terminal className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateMode('ide');
        onClose();
      },
    },
    {
      id: 'cmd-dashboard',
      category: 'Navigation',
      label: 'Go to Dashboard HQ',
      shortcut: 'Ctrl+Shift+D',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigateMode('dashboard');
        onClose();
      },
    },
    {
      id: 'cmd-academy',
      category: 'Navigation',
      label: 'Open OPROX Academy',
      shortcut: 'Ctrl+Shift+M',
      icon: <GraduationCap className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigateMode('academy');
        onClose();
      },
    },
    {
      id: 'cmd-ai-os',
      category: 'Navigation',
      label: 'Open AI Studio OS',
      shortcut: 'Ctrl+Shift+A',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateMode('ai-os');
        onClose();
      },
    },
    {
      id: 'cmd-database',
      category: 'Navigation',
      label: 'Open Database Studio',
      shortcut: 'Ctrl+Shift+B',
      icon: <Database className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateMode('database');
        onClose();
      },
    },
    {
      id: 'cmd-cloud',
      category: 'Navigation',
      label: 'Open Cloud Monitors & Deploy',
      shortcut: 'Ctrl+Shift+C',
      icon: <Cloud className="w-4 h-4 text-teal-400" />,
      action: () => {
        onNavigateMode('cloud');
        onClose();
      },
    },
    {
      id: 'cmd-new-proj',
      category: 'Workspace',
      label: 'Create New Workspace Application',
      shortcut: 'Ctrl+N',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenNewProject();
      },
    },
    {
      id: 'cmd-theme',
      category: 'Preferences',
      label: 'Toggle Light / Dark Theme',
      shortcut: 'Ctrl+T',
      icon: isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onToggleTheme();
      },
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Command className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search workspace (Ctrl+K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full bg-transparent text-sm font-semibold focus:outline-none ${
              isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
            }`}
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              No matching commands found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                  isDark ? 'hover:bg-slate-800/80 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    {cmd.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold">{cmd.label}</h5>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {cmd.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {cmd.shortcut && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                      {cmd.shortcut}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 px-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>OPROX Command Palette v4.2</span>
          <span>Press ESC or Click Outside to Dismiss</span>
        </div>
      </div>
    </div>
  );
};
