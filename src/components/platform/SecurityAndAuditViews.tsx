import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  FileCheck,
  Lock,
  Smartphone,
  Globe,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { PlatformViewId } from './platformTypes';

interface SecurityViewsProps {
  viewId: PlatformViewId;
  theme?: 'dark' | 'light';
}

export const SecurityAndAuditViews: React.FC<SecurityViewsProps> = ({ viewId, theme = 'dark' }) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (Array.isArray(data)) setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewId === 'audit-logs' || viewId === 'activity-logs') {
      fetchAuditLogs();
    }
  }, [viewId]);

  if (viewId === 'security-center') {
    return (
      <div className="space-y-6 select-none">
        {/* Security Score Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-2xl">
              98%
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span>Enterprise Security Health Score</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  SOC2 Compliant
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                0 Critical Vulnerabilities • 2FA Enforced • IP Whitelist Active
              </p>
            </div>
          </div>

          <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-all shadow-md">
            Run Security Audit Scan
          </button>
        </div>

        {/* Security Controls Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">2FA Multi-Factor Auth</span>
              <span className="text-emerald-400 font-bold">100% Enforced</span>
            </div>
            <p className="text-slate-400 text-[11px]">All 24 team members have hardware or TOTP 2FA enabled.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">IP Whitelist Range</span>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>
            <p className="text-slate-400 text-[11px]">Restricted to authorized enterprise corporate VPN ranges.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">API Key Rotation</span>
              <span className="text-cyan-400 font-bold">90 Days Cycle</span>
            </div>
            <p className="text-slate-400 text-[11px]">Automated key expiration alerts configured.</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewId === 'activity-logs') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Real-Time User Activity Stream</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Live telemetry feed of user actions across all solution modules.
            </p>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stream</span>
          </button>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {auditLogs.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 text-slate-400 text-center">No active activity logs found.</div>
          ) : (
            auditLogs.map((log: any, idx: number) => (
              <div key={log.id || idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-white">{log.actorId || 'System'}: </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3">
                  <span className="text-indigo-400">{log.type}</span>
                  <span className="text-emerald-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (viewId === 'audit-logs') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              <span>Immutable SOC2 Compliance Audit Log History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Encrypted audit trails for administrative privilege escalation, key generation, and RBAC changes.
            </p>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Audit Database</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-bold">Event ID</th>
                <th className="pb-3 font-bold">Actor</th>
                <th className="pb-3 font-bold">Action Category</th>
                <th className="pb-3 font-bold">Timestamp</th>
                <th className="pb-3 font-bold text-right">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {auditLogs.map((log: any, idx: number) => (
                <tr key={log.id || idx} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3 font-bold text-indigo-300">{(log.id || 'id').slice(0, 8)}</td>
                  <td className="py-3 text-slate-300">{log.actorId || 'admin'}</td>
                  <td className="py-3 text-white font-bold">{log.type}</td>
                  <td className="py-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-3 text-right text-slate-300 max-w-xs truncate">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};

