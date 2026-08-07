import React, { useState } from 'react';
import {
  Settings,
  Shield,
  CreditCard,
  Key,
  Users,
  CheckCircle2,
  HardDrive,
  Cpu,
  Calendar,
  Lock,
  Plus,
  Save,
  Check
} from 'lucide-react';
import { SolutionPermission, BillingSummary } from '../../types';

interface SolutionsSettingsBillingProps {
  permissions: SolutionPermission[];
  billingSummary: BillingSummary;
  theme?: 'dark' | 'light';
}

export const SolutionsSettingsBilling: React.FC<SolutionsSettingsBillingProps> = ({
  permissions,
  billingSummary,
  theme = 'dark'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'permissions' | 'billing' | 'integrations'>('billing');

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState('https://api.oprox.io/v1/webhooks/solutions-events');
  const [savedWebhook, setSavedWebhook] = useState(false);

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedWebhook(true);
    setTimeout(() => setSavedWebhook(false), 2000);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Sub-Tab Navigation Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">
              Solutions Settings, Permissions & Billing
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Manage RBAC roles, platform API webhooks, and enterprise consumption tiers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveSubTab('billing')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              activeSubTab === 'billing' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Billing Summary
          </button>

          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              activeSubTab === 'permissions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RBAC Permissions
          </button>

          <button
            onClick={() => setActiveSubTab('integrations')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              activeSubTab === 'integrations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Webhooks & API
          </button>
        </div>
      </div>

      {/* 1. BILLING SUMMARY */}
      {activeSubTab === 'billing' && (
        <div className="space-y-6">
          {/* Plan Header Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Current Plan
              </span>
              <h2 className="text-2xl font-black text-white">{billingSummary.planName}</h2>
              <p className="text-xs text-slate-400 font-mono">
                Next billing date: <strong className="text-slate-200">{billingSummary.nextBillingDate}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Estimated Monthly Cost</span>
              <span className="text-2xl font-black text-emerald-400">{billingSummary.estimatedCost}</span>
            </div>
          </div>

          {/* Consumption Metrics Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tokens Gauge */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>AI Inference Tokens</span>
                </span>
                <span className="text-emerald-400 font-bold">{billingSummary.usedTokensPercent}%</span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${billingSummary.usedTokensPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 font-mono">
                Quota: <strong className="text-slate-200">{billingSummary.monthlyQuotaTokens}</strong> tokens / month
              </p>
            </div>

            {/* Storage Compute */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Media & Asset Storage</span>
                </span>
                <span className="text-cyan-400 font-bold">
                  {Math.round((billingSummary.storageUsedGB / billingSummary.storageMaxGB) * 100)}%
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${(billingSummary.storageUsedGB / billingSummary.storageMaxGB) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 font-mono">
                Used: <strong className="text-slate-200">{billingSummary.storageUsedGB} GB</strong> / {billingSummary.storageMaxGB} GB
              </p>
            </div>

            {/* Active Seats */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Licensed Member Seats</span>
                </span>
                <span className="text-indigo-400 font-bold">
                  {Math.round((billingSummary.activeSeats / billingSummary.maxSeats) * 100)}%
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${(billingSummary.activeSeats / billingSummary.maxSeats) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 font-mono">
                Active: <strong className="text-slate-200">{billingSummary.activeSeats} Seats</strong> / {billingSummary.maxSeats} Max
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. RBAC PERMISSIONS */}
      {activeSubTab === 'permissions' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span>Role-Based Access Control (RBAC) Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure module security scopes and member permission policies across solutions.
              </p>
            </div>
            <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {permissions.map((perm) => (
              <div key={perm.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-400 font-mono">{perm.role} Role</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                    {perm.permissions.length} Scopes Active
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  {perm.permissions.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. INTEGRATIONS & WEBHOOKS */}
      {activeSubTab === 'integrations' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <span>Platform Webhooks & API Webhook Integration</span>
          </h2>

          <form onSubmit={handleSaveWebhook} className="space-y-3 max-w-xl font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Live Telemetry Webhook Endpoint URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer transition-all flex items-center gap-2"
            >
              {savedWebhook ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedWebhook ? 'Webhook Updated!' : 'Save Integration'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
