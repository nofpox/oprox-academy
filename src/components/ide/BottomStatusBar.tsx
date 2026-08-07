import React from 'react';
import {
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Server,
  Globe,
  Terminal,
  Code2,
  Wifi
} from 'lucide-react';

interface BottomStatusBarProps {
  currentProject: string;
  activeFilePath: string | null;
  errorCount?: number;
  warningCount?: number;
  theme?: 'dark' | 'light';
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  currentProject,
  activeFilePath,
  errorCount = 0,
  warningCount = 2,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`px-3 py-1 border-t flex flex-wrap items-center justify-between text-[11px] font-mono select-none ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
    }`}>
      {/* Left Info Group */}
      <div className="flex items-center gap-4">
        {/* Git Branch */}
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <GitBranch className="w-3 h-3" />
          <span>main*</span>
        </div>

        {/* Errors & Warnings */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>{errorCount}</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <AlertCircle className="w-3 h-3" />
            <span>{warningCount}</span>
          </span>
        </div>

        <span className="text-slate-600">|</span>

        {/* Current Project */}
        <span className="font-bold text-slate-300 truncate max-w-[150px]">
          {currentProject}
        </span>

        {/* Active File Path */}
        {activeFilePath && (
          <span className="text-slate-500 truncate max-w-[200px]">
            {activeFilePath}
          </span>
        )}
      </div>

      {/* Right Info Group */}
      <div className="flex items-center gap-4">
        {/* Cursor Position */}
        <span>Ln 42, Col 18</span>

        {/* Encoding & Language */}
        <span>UTF-8</span>
        <span className="text-emerald-400 font-bold">TypeScript React</span>

        <span className="text-slate-600">|</span>

        {/* Port Status */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Wifi className="w-3 h-3" />
          <span>Port 3000 (0.0.0.0)</span>
        </div>
      </div>
    </div>
  );
};
