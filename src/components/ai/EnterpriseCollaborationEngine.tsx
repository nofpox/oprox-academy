import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  FileCheck,
  GitPullRequest,
  Lock,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Sliders,
  FolderTree,
  UserCheck,
  Building2,
  Scale
} from 'lucide-react';

interface EnterpriseCollaborationEngineProps {
  projectTitle?: string;
  theme?: 'dark' | 'light';
}

export const EnterpriseCollaborationEngine: React.FC<EnterpriseCollaborationEngineProps> = ({
  projectTitle = 'OPROX Enterprise Workspace',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'hierarchy' | 'change_requests' | 'autonomy' | 'code_owners' | 'audit'>('change_requests');
  const [autonomyLevel, setAutonomyLevel] = useState<number>(2);
  const [maxAiCost, setMaxAiCost] = useState<number>(5.0);
  const [changeRequests, setChangeRequests] = useState<any[]>([
    {
      id: 'cr_demo_101',
      title: 'feat: Autonomous Phase 5 Enterprise Collaboration Layer',
      authorId: 'agent_oprox_coder_v5',
      authorType: 'ai_agent',
      riskClassification: 'HIGH',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      filesChanged: [
        { path: 'server/phase5Routes.ts', content: '+ export default router;' },
        { path: 'src/lib/phase5AutonomyEngine.ts', content: '+ export function classifyChangeRisk' },
      ],
      aiProposalMeta: {
        agentId: 'agent_oprox_coder_v5',
        estimatedAiCostUsd: '0.0025',
        securityImpact: 'STANDARD',
      },
      approvals: [
        { id: 'app_1', approverId: 'usr_tech_lead', decision: 'APPROVED', status: 'VALID' }
      ]
    }
  ]);

  const [events, setEvents] = useState<any[]>([
    {
      id: 'evt_1',
      action: 'CHANGE_REQUEST_CREATED',
      actorId: 'agent_oprox_coder_v5',
      actorType: 'ai_agent',
      resource: 'CHANGE_REQUEST',
      resourceId: 'cr_demo_101',
      risk: 'HIGH',
      timestamp: new Date().toISOString()
    }
  ]);

  return (
    <div className={`p-6 rounded-3xl border shadow-2xl ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Control Plane Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-black tracking-tight">Enterprise Collaboration & Governed Autonomy</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Phase 5 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative multi-tenant governance, segregation of duties, code ownership, risk classification & AI autonomy limits.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <span className="text-slate-400 px-2">Autonomy Gate:</span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
            Level {autonomyLevel} — Active
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 mt-6 pb-4 border-b border-slate-800/60">
        <button
          onClick={() => setActiveTab('change_requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'change_requests'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          Change Requests & AI Proposals
        </button>

        <button
          onClick={() => setActiveTab('autonomy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'autonomy'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Governed Autonomy Policy
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'hierarchy'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Org & Workspace Hierarchy
        </button>

        <button
          onClick={() => setActiveTab('code_owners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'code_owners'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Code Owners & Protection
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Audit & Activity Explorer
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="mt-6">
        {activeTab === 'change_requests' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
              Active Authoritative Change Requests
            </h3>

            {changeRequests.map((cr) => (
              <div key={cr.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">{cr.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        cr.riskClassification === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        cr.riskClassification === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {cr.riskClassification} Risk
                      </span>
                    </div>
                    <h4 className="text-base font-bold mt-1 text-slate-100">{cr.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Author: <span className="font-mono text-emerald-400">{cr.authorId}</span> ({cr.authorType})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Change
                    </button>
                    <button className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer">
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-xs text-slate-300">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Files Changed ({cr.filesChanged.length})</div>
                  {cr.filesChanged.map((f: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-0.5">
                      <span>{f.path}</span>
                      <span className="text-emerald-400">{f.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'autonomy' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                AI Autonomy Level Settings (0–4)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setAutonomyLevel(lvl)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      autonomyLevel === lvl
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">Level {lvl}</div>
                    <div className="text-[10px] mt-1 text-slate-400">
                      {lvl === 0 ? 'Suggest Only' : lvl === 1 ? 'Workspace Edit' : lvl === 2 ? 'Test & Repair' : lvl === 3 ? 'Autonomous Dev' : 'Governed Delivery'}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block">Max AI Cost Per Task (USD)</label>
                  <span className="text-[10px] text-slate-500">Task execution halts if estimated AI token cost exceeds threshold</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={maxAiCost}
                  onChange={(e) => setMaxAiCost(parseFloat(e.target.value) || 1)}
                  className="w-32 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              Organization & Team Hierarchy
            </h3>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div>🏢 Organization: <span className="text-emerald-400 font-bold">org_tenant_a</span></div>
              <div className="pl-4">📁 Project: <span className="text-cyan-400 font-bold">proj_oprox_code</span></div>
              <div className="pl-8">💻 Workspace: <span className="text-indigo-400 font-bold">ws_development</span></div>
              <div className="pl-12">👥 Team: <span className="text-amber-400 font-bold">Core Engineering</span></div>
            </div>
          </div>
        )}

        {activeTab === 'code_owners' && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Protected Paths & Code Owners
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-amber-400">/server/**</span>
                <span className="text-slate-400">Owner: Tech Lead</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-rose-400">/src/db/**</span>
                <span className="text-slate-400">Owner: Core DB Team</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Real-time Collaboration Event Stream
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {events.map((evt) => (
                <div key={evt.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{evt.action}</span>
                    <span className="text-slate-500">by {evt.actorId}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
