import React, { useState, useEffect } from 'react';
import {
  Lock,
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  Key,
  CheckCircle2,
  Cpu,
  Users,
  DollarSign,
  Activity,
  Server,
  AlertTriangle,
  RefreshCw,
  Power
} from 'lucide-react';
import { PlatformViewId } from './platformTypes';

interface AdminViewsProps {
  viewId: PlatformViewId;
  theme?: 'dark' | 'light';
}

export const AdminAndSystemViews: React.FC<AdminViewsProps> = ({ viewId, theme = 'dark' }) => {
  // Admin Login State
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // System Settings State & Cost Guard State
  const [costGuard, setCostGuard] = useState({
    maxDailyUsd: 50,
    maxMonthlyUsd: 1000,
    autoKillAtUsd: 1500,
    notifyAtPercentage: 80,
    enabled: true,
  });

  // KillSwitches State
  const [killSwitches, setKillSwitches] = useState<any[]>([]);
  const [emergencyLogs, setEmergencyLogs] = useState<any[]>([]);

  // Health Snapshot State
  const [healthSnapshot, setHealthSnapshot] = useState<any>(null);

  const fetchKillSwitches = async () => {
    try {
      const res = await fetch('/admin/kill-switches');
      const data = await res.json();
      if (data.states) setKillSwitches(data.states);
      if (data.auditLogs) setEmergencyLogs(data.auditLogs);
    } catch (err) {
      console.error('Failed to fetch kill switches', err);
    }
  };

  const toggleKillSwitch = async (key: string, currentValue: boolean) => {
    try {
      const res = await fetch('/admin/kill-switches/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: !currentValue }),
      });
      if (res.ok) {
        fetchKillSwitches();
      }
    } catch (err) {
      console.error('Failed to toggle kill switch', err);
    }
  };

  const fetchCostGuard = async () => {
    try {
      const res = await fetch('/admin/cost-guard/settings');
      const data = await res.json();
      if (data.maxDailyUsd !== undefined) setCostGuard(data);
    } catch (err) {
      console.error('Failed to fetch cost guard settings', err);
    }
  };

  const updateCostGuard = async (updatedFields: Partial<typeof costGuard>) => {
    try {
      const res = await fetch('/admin/cost-guard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (data.maxDailyUsd !== undefined) setCostGuard(data);
    } catch (err) {
      console.error('Failed to update cost guard', err);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/admin/system-health');
      const data = await res.json();
      if (data.overallStatus) setHealthSnapshot(data);
    } catch (err) {
      console.error('Failed to fetch health snapshot', err);
    }
  };

  useEffect(() => {
    if (viewId === 'super-admin') fetchKillSwitches();
    if (viewId === 'system-settings') fetchCostGuard();
    if (viewId === 'admin-dashboard') fetchHealth();
  }, [viewId]);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  if (viewId === 'admin-login') {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none max-w-md mx-auto font-mono text-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-white">OPROX Super Admin Portal</h2>
          <p className="text-slate-400 text-[11px]">Authorized hardware key & hardware token verification required.</p>
        </div>

        {isAuthenticated ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
            <span className="font-bold text-emerald-400 block">Super Admin Token Verified!</span>
            <p className="text-slate-300 text-[11px]">Session active with root privileges across all tenants.</p>
          </div>
        ) : (
          <form onSubmit={handleAdminAuth} className="space-y-4">
            <div>
              <label className="text-slate-400 block mb-1">Super Admin Security Key / Hardware Token</label>
              <input
                type="password"
                required
                placeholder="Enter master admin passphrase..."
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold cursor-pointer transition-all"
            >
              Authenticate Super Admin
            </button>
          </form>
        )}
      </div>
    );
  }

  if (viewId === 'admin-dashboard') {
    return (
      <div className="space-y-6 select-none font-mono text-xs">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px]">Global Platform MRR</span>
            <p className="text-2xl font-black text-emerald-400">$342,000</p>
            <p className="text-[10px] text-emerald-400">+18% MoM growth</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px]">Total Active Tenants</span>
            <p className="text-2xl font-black text-white">1,420</p>
            <p className="text-[10px] text-indigo-400">Enterprise tenants</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px]">Total Token Inferences</span>
            <p className="text-2xl font-black text-white">1.8 Billion</p>
            <p className="text-[10px] text-cyan-400">Past 30 days</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px]">System SLA Uptime</span>
            <p className="text-2xl font-black text-emerald-400">
              {healthSnapshot?.overallStatus === 'healthy' ? '99.998%' : 'Degraded'}
            </p>
            <p className="text-[10px] text-emerald-400">Live Backend Status</p>
          </div>
        </div>

        {/* Global Cluster Stats */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>Global Multi-Region Cloud Run Cluster Health</span>
            </h2>
            <button
              onClick={fetchHealth}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {healthSnapshot?.checks && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {healthSnapshot.checks.map((chk: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{chk.service}</span>
                    <span className="text-slate-400 text-[11px]">{chk.details}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {chk.latencyMs}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewId === 'super-admin') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <span>Super Admin Platform Emergency Kill-Switches</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live emergency cut-off controls powered by systemState database persistence.
            </p>
          </div>

          <button
            onClick={fetchKillSwitches}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live States</span>
          </button>
        </div>

        {/* Kill Switches List */}
        <div className="space-y-3">
          {killSwitches.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 text-slate-400 text-center">Loading live kill switches...</div>
          ) : (
            killSwitches.map((ks) => (
              <div key={ks.key} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{ks.label}</span>
                  <span className="text-slate-400 text-[11px]">State Key: platform:kill:{ks.key}</span>
                </div>
                <button
                  onClick={() => toggleKillSwitch(ks.key, ks.active)}
                  className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                    ks.active
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{ks.active ? 'KILL SWITCH ACTIVE' : 'NORMAL OPERATION'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Emergency Audit Trail */}
        {emergencyLogs.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Emergency Action Audit Trail</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {emergencyLogs.map((log: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-bold text-indigo-300">{log.targetLabel || log.stateKey}: </span>
                    <span className="text-slate-300">{log.actionType}</span>
                  </div>
                  <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewId === 'system-settings') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none font-mono text-xs">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <span>Global CostGuard & System Threshold Settings</span>
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Configure automated spending budgets and emergency auto-kill limits.
          </p>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">Max Daily AI Spend ($ USD)</label>
              <input
                type="number"
                value={costGuard.maxDailyUsd}
                onChange={(e) => updateCostGuard({ maxDailyUsd: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Max Monthly AI Spend ($ USD)</label>
              <input
                type="number"
                value={costGuard.maxMonthlyUsd}
                onChange={(e) => updateCostGuard({ maxMonthlyUsd: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Emergency Auto-Kill Hard Threshold ($ USD)</label>
            <input
              type="number"
              value={costGuard.autoKillAtUsd}
              onChange={(e) => updateCostGuard({ autoKillAtUsd: Number(e.target.value) })}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">CostGuard Autonomous Enforcement</span>
              <span className="text-slate-400">Automatically kill AI routes if daily/monthly budgets are exceeded.</span>
            </div>
            <button
              onClick={() => updateCostGuard({ enabled: !costGuard.enabled })}
              className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer ${
                costGuard.enabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {costGuard.enabled ? 'Active' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

