import React, { useState, useEffect } from 'react';
import {
  Key,
  Globe,
  Database,
  HardDrive,
  Cloud,
  Layers,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Server,
  Activity,
  AlertOctagon
} from 'lucide-react';
import { PlatformViewId } from './platformTypes';

interface DeveloperViewsProps {
  viewId: PlatformViewId;
  theme?: 'dark' | 'light';
}

export const DeveloperAndInfrastructureViews: React.FC<DeveloperViewsProps> = ({ viewId, theme = 'dark' }) => {
  // API Keys State
  const [apiKeys, setApiKeys] = useState([
    { id: 'key_1', name: 'Production Server Token', key: 'op_live_89410f92b4a187c2d9', scope: 'Full Access', created: 'July 10, 2026' },
    { id: 'key_2', name: 'Staging Environment Key', key: 'op_test_12480a91f3c8821a00', scope: 'Read Only', created: 'July 22, 2026' }
  ]);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Health and Alerts State
  const [healthSnapshot, setHealthSnapshot] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);

  const fetchHealthAndAlerts = async () => {
    try {
      const [hRes, iRes] = await Promise.all([
        fetch('/admin/system-health'),
        fetch('/admin/operational-alerts/incidents')
      ]);
      const hData = await hRes.json();
      const iData = await iRes.json();

      if (hData.overallStatus) setHealthSnapshot(hData);
      if (Array.isArray(iData)) setIncidents(iData);
    } catch (err) {
      console.error('Failed to fetch system health / alerts', err);
    }
  };

  useEffect(() => {
    if (viewId === 'status-page' || viewId === 'deployments') {
      fetchHealthAndAlerts();
    }
  }, [viewId]);

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateKey = () => {
    const newKey = {
      id: `key_${Date.now()}`,
      name: `New API Key #${apiKeys.length + 1}`,
      key: `op_live_${Math.random().toString(36).substring(2, 18)}`,
      scope: 'Standard API',
      created: 'Just now'
    };
    setApiKeys((prev) => [newKey, ...prev]);
  };

  if (viewId === 'status-page') {
    return (
      <div className="space-y-6 select-none font-mono text-xs">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Real-Time System Health & Operational Telemetry</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live checks for database latency, AI provider circuit breakers, and active incidents.
            </p>
          </div>

          <button
            onClick={fetchHealthAndAlerts}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Poll Health Status</span>
          </button>
        </div>

        {/* Live Service Status Checks */}
        {healthSnapshot?.checks && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthSnapshot.checks.map((chk: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block text-sm">{chk.service}</span>
                  <span className="text-slate-400 text-[11px]">{chk.details}</span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold block mb-1">
                    {chk.status.toUpperCase()}
                  </span>
                  <span className="text-slate-500 text-[10px]">{chk.latencyMs}ms latency</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Incidents & Alerts */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span>Operational Alert Incident Register</span>
          </h2>

          {incidents.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-center font-bold">
              ✓ Zero Open Operational Incidents — All Subsystems Nominal
            </div>
          ) : (
            incidents.map((inc) => (
              <div key={inc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-red-400 block">{inc.message}</span>
                  <span className="text-slate-500 text-[11px]">Metric: {inc.metric} • Triggered: {new Date(inc.createdAt).toLocaleString()}</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px]">
                  {inc.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (viewId === 'api-keys') {
    return (
      <div className="space-y-6 select-none">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <span>Platform Secret Keys & API Tokens</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Generate secret access tokens for programmatic backend integrations.
            </p>
          </div>

          <button
            onClick={handleCreateKey}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Secret Key</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-bold">Key Label</th>
                  <th className="pb-3 font-bold">Secret Token</th>
                  <th className="pb-3 font-bold">Scope</th>
                  <th className="pb-3 font-bold">Created Date</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 font-bold text-white">{k.name}</td>
                    <td className="py-3 text-emerald-300">{k.key}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 font-bold text-indigo-300">
                        {k.scope}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{k.created}</td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => handleCopyKey(k.id, k.key)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setApiKeys((prev) => prev.filter((p) => p.id !== k.id))}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 cursor-pointer"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (viewId === 'integrations') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Third-Party Cloud Integrations & Connectors</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Connect your OPROX tenant with GitHub, Stripe, AWS, Slack, and Google Cloud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {[
            { name: 'GitHub Sync', status: 'Connected', desc: 'Auto-commit AI-generated code to main repository.' },
            { name: 'Stripe Metering', status: 'Connected', desc: 'Usage-based billing token sync with Stripe API.' },
            { name: 'Google Cloud Run', status: 'Active', desc: 'Production deployment target for full-stack apps.' },
            { name: 'Slack Webhooks', status: 'Configured', desc: 'Real-time alert notifications for team channels.' },
            { name: 'AWS S3 Storage', status: 'Available', desc: 'External media bucket backup destination.' },
            { name: 'Vercel Edge', status: 'Available', desc: 'Edge function proxy for low-latency routing.' }
          ].map((int, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{int.name}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  int.status === 'Connected' || int.status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {int.status}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{int.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewId === 'domains') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>Custom Domains & SSL Certificates</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Manage custom DNS records, CNAME pointing, and automatic Let's Encrypt SSL certificates.
            </p>
          </div>
          <button className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Domain</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">app.oprox.io</span>
              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                SSL Active (TLS 1.3)
              </span>
            </div>
            <p className="text-slate-400">DNS Target: cname.cloudrun.oprox.io • Status: Verified</p>
          </div>
          <button className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (viewId === 'deployments') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <span>Production Deployments & Cloud Run Containers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Container build status, commit hashes, and Cloud Run execution logs.
          </p>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {[
            { id: 'dep_0041', commit: 'feat: add phase 1 core control backend', status: 'Deployed', time: 'Just now', duration: '12s' },
            { id: 'dep_0040', commit: 'fix: optimize solution studio launch pad', status: 'Deployed', time: '2 hours ago', duration: '14s' },
            { id: 'dep_0039', commit: 'chore: update drizzle ORM schema definitions', status: 'Deployed', time: 'Yesterday', duration: '11s' }
          ].map((dep) => (
            <div key={dep.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{dep.commit}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {dep.status}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">Build ID: {dep.id} • Deployed {dep.time} • Duration {dep.duration}</p>
              </div>

              <button className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer flex items-center gap-1.5 text-xs font-bold">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Container Log</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewId === 'database-studio') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Drizzle PostgreSQL Visual Studio</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Inspect database tables, foreign key relationship ERDs, and pending Drizzle migrations.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
            PostgreSQL 16 Engine Active
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Schema File: src/db/schema.ts</span>
            <span className="text-emerald-400">8 Tables Registered</span>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 overflow-x-auto text-[11px]">
{`export const systemStateTable = pgTable("system_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emergencyActionsLogTable = pgTable("emergency_actions_log", {...});
export const costGuardSettingsTable = pgTable("cost_guard_settings", {...});
export const platformHealthSnapshotsTable = pgTable("platform_health_snapshots", {...});
export const auditLogsTable = pgTable("audit_logs", {...});`}
          </pre>
        </div>
      </div>
    );
  }

  if (viewId === 'storage') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <span>Object Asset Storage & CDN Cache</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            High-speed asset distribution buckets for 4K video renders and storyboards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white block">Bucket: oprox-media-renders-prod</span>
            <p className="text-slate-400 text-[11px]">Region: us-central1 • Storage Used: 142 GB • Files: 12,400</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white block">Bucket: oprox-static-assets-cdn</span>
            <p className="text-slate-400 text-[11px]">Region: global-edge • Storage Used: 42 GB • Cache Hit: 99.4%</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
