// OPROX Phase 11 — Toast Notification Visual Renderer

import React from 'react';
import { useUIState } from './UIStateContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const NotificationToastContainer: React.FC = () => {
  const { notifications, dismissNotification, theme } = useUIState();
  const isDark = theme === 'dark';

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
      {notifications.map((notif) => {
        const isSuccess = notif.type === 'success';
        const isError = notif.type === 'error';
        const isWarning = notif.type === 'warning';

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              isDark
                ? isSuccess
                  ? 'bg-slate-900/95 border-emerald-500/40 text-slate-100'
                  : isError
                  ? 'bg-slate-900/95 border-red-500/40 text-slate-100'
                  : isWarning
                  ? 'bg-slate-900/95 border-amber-500/40 text-slate-100'
                  : 'bg-slate-900/95 border-slate-700 text-slate-100'
                : isSuccess
                ? 'bg-white/95 border-emerald-500/40 text-slate-900'
                : isError
                ? 'bg-white/95 border-red-500/40 text-slate-900'
                : isWarning
                ? 'bg-white/95 border-amber-500/40 text-slate-900'
                : 'bg-white/95 border-slate-300 text-slate-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <XCircle className="w-5 h-5 text-red-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-xs font-extrabold truncate">{notif.title}</h5>
                <span className="text-[9px] font-mono opacity-50 shrink-0">{notif.timestamp}</span>
              </div>
              <p className="text-[11px] font-mono opacity-80 leading-relaxed break-words">{notif.message}</p>

              {notif.actionLabel && notif.onAction && (
                <button
                  onClick={() => {
                    notif.onAction?.();
                    dismissNotification(notif.id);
                  }}
                  className="mt-2 text-[10px] font-mono font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  {notif.actionLabel} →
                </button>
              )}
            </div>

            <button
              onClick={() => dismissNotification(notif.id)}
              className="p-1 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
