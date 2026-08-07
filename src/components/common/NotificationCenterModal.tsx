import React, { useState } from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, ShieldCheck, Info, Trash2, CheckCheck, RefreshCw } from 'lucide-react';
import { UINotification } from '../../integration/types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UINotification[];
  onDismiss: (id: string) => void;
  onClearAll?: () => void;
  theme?: 'dark' | 'light';
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onDismiss,
  onClearAll,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');

  const filtered = notifications.filter((n) => (filter === 'all' ? true : n.type === filter));

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold">Global System Notifications</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                  {notifications.length} Active
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Real-time security, build, deployment, and AI governance events
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills & Bar */}
        <div className={`p-4 border-b flex items-center justify-between gap-2 overflow-x-auto ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-100/50'
        }`}>
          <div className="flex items-center gap-1.5">
            {(['all', 'info', 'success', 'warning', 'error'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {onClearAll && notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-400/50 mx-auto" />
              <p className="text-sm font-bold text-slate-400">All System Events Clear</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No active notifications in category &quot;{filter}&quot;. All background systems operational.
              </p>
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  isDark ? 'bg-slate-950 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(n.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm">{n.title}</h4>
                      {n.timestamp && (
                        <span className="text-[10px] text-slate-500 font-mono">{n.timestamp}</span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {n.message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onDismiss(n.id)}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
