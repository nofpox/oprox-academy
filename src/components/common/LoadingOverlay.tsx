import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingOverlayProps {
  label?: string;
  step?: string;
  progress?: number;
  theme?: 'dark' | 'light';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  label = 'OPROX Engine Processing...',
  step = 'Compiling AST and executing verification routines',
  progress,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center space-y-4 select-none animate-pulse ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-slate-100'
          : 'bg-white/90 border-slate-300 text-slate-900'
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <Sparkles className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-extrabold">{label}</h4>
        <p className="text-xs font-mono text-slate-400">{step}</p>
      </div>

      {progress !== undefined && (
        <div className="w-full max-w-xs space-y-1 font-mono text-xs">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
