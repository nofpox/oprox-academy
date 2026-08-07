import React from 'react';
import { Inbox, Sparkles, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  theme?: 'dark' | 'light';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  description = 'There are no active records matching your current filter criteria.',
  actionLabel,
  onAction,
  icon,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center space-y-4 select-none ${
        isDark
          ? 'bg-slate-900/60 border-slate-800 text-slate-300'
          : 'bg-slate-100/80 border-slate-300 text-slate-700'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
          isDark
            ? 'bg-slate-950 border border-slate-800 text-emerald-400'
            : 'bg-white border border-slate-300 text-emerald-600'
        }`}
      >
        {icon || <Inbox className="w-6 h-6" />}
      </div>

      <div className="space-y-1 max-w-md">
        <h3
          className={`text-base font-extrabold ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {title}
        </h3>
        <p className="text-xs font-mono opacity-80 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs font-mono cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
