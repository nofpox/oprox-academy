import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  diagnosticDetails?: string;
  onRetry?: () => void;
  theme?: 'dark' | 'light';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'System Error Detected',
  message = 'An unexpected issue occurred while processing your request. The OPROX self-healing handler logged this incident.',
  diagnosticDetails,
  onRetry,
  theme = 'dark'
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div
      className={`p-6 rounded-2xl border text-left space-y-4 select-none ${
        isDark
          ? 'bg-red-950/20 border-red-500/30 text-slate-200'
          : 'bg-red-50 border-red-300 text-red-900'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-red-400">{title}</h3>
            <p className="text-xs font-mono opacity-90 mt-0.5">{message}</p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs font-mono cursor-pointer transition-all shrink-0 flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </button>
        )}
      </div>

      {diagnosticDetails && (
        <div className="pt-2 border-t border-red-500/20 text-xs font-mono">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-red-400 hover:underline flex items-center gap-1 text-[11px] font-bold cursor-pointer"
          >
            <span>{showDetails ? 'Hide System Diagnostics' : 'View System Diagnostics'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <pre
              className={`mt-2 p-3 rounded-xl border text-[10px] overflow-x-auto ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-red-300'
                  : 'bg-white border-red-200 text-red-800'
              }`}
            >
              {diagnosticDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
