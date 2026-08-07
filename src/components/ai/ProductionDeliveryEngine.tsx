import React, { useState, useEffect } from 'react';
import {
  Rocket,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Database,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Server,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react';

interface ProductionDeliveryEngineProps {
  theme?: 'dark' | 'light';
  projectTitle?: string;
}

export const ProductionDeliveryEngine: React.FC<ProductionDeliveryEngineProps> = ({
  theme = 'dark',
  projectTitle = 'OPROX Autonomous System',
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<
    'deployments' | 'release_gate' | 'env_gov' | 'health' | 'migrations' | 'rollback' | 'incidents'
  >('deployments');

  // State
  const [deployments, setDeployments] = useState<any[]>([]);
  const [releaseGate, setReleaseGate] = useState<any>(null);
  const [envReport, setEnvReport] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [migrationSafety, setMigrationSafety] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Auth token helper
  const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token') || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeader();

      const [depRes, gateRes, envRes, healthRes, migRes, revRes, incRes] = await Promise.all([
        fetch('/api/phase4/deployments', { headers }),
        fetch('/api/phase4/release-gate', { headers }),
        fetch('/api/phase4/env/validate', { headers }),
        fetch('/api/phase4/health/inspect', { headers }),
        fetch('/api/phase4/migrations/safety', { headers }),
        fetch('/api/phase4/revisions', { headers }),
        fetch('/api/phase4/incidents', { headers }),
      ]);

      if (depRes.ok) setDeployments((await depRes.json()).deployments || []);
      if (gateRes.ok) setReleaseGate((await gateRes.json()).releaseGate || null);
      if (envRes.ok) setEnvReport(await envRes.json());
      if (healthRes.ok) setHealthData(await healthRes.json());
      if (migRes.ok) setMigrationSafety(await migRes.json());
      if (revRes.ok) setRevisions((await revRes.json()).revisions || []);
      if (incRes.ok) setIncidents((await incRes.json()).incidents || []);
    } catch (err) {
      console.error('Error fetching Phase 4 data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleTriggerDeployment = async () => {
    setLoading(true);
    setStatusMsg('Orchestrating deployment pipeline...');
    try {
      const res = await fetch('/api/phase4/deployments', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ environment: 'production', provider: 'cloudrun' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(`Deployment Failed: ${data.error || data.failureReason}`);
      } else {
        setStatusMsg(`Deployment State: ${data.status}`);
      }
      await fetchData();
    } catch (err: any) {
      setStatusMsg(`Error triggering deployment: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateReleaseGate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/phase4/release-gate/evaluate', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ environment: 'production' }),
      });
      const data = await res.json();
      setReleaseGate(data);
      setStatusMsg(`Release Gate Decision: ${data.decision}`);
    } catch (err: any) {
      setStatusMsg(`Release Gate Error: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRollback = async (targetRevId: string) => {
    if (!confirm(`Confirm rollback to revision [${targetRevId}]?`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/phase4/rollback/execute', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ targetRevisionId: targetRevId, reason: 'Manual UI Triggered Rollback' }),
      });
      const data = await res.json();
      setStatusMsg(`Rollback Result: ${data.verifiedStatus} (${data.details})`);
      await fetchData();
    } catch (err: any) {
      setStatusMsg(`Rollback Error: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black tracking-tight">Phase 4: Production Delivery & Operations</h2>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Autonomous Delivery Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed deployment orchestration, release gate, migration safety, health inspection & rollback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh State
          </button>
          <button
            onClick={handleTriggerDeployment}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Rocket className="w-4 h-4 stroke-[2.5]" />
            Orchestrate Deploy
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mt-6 border-b border-slate-800/80 pb-3">
        {[
          { id: 'deployments', label: 'Deployments', icon: <Rocket className="w-3.5 h-3.5" /> },
          { id: 'release_gate', label: 'Release Gate', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
          { id: 'env_gov', label: 'Secret Governance', icon: <Lock className="w-3.5 h-3.5" /> },
          { id: 'health', label: 'Runtime Health', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'migrations', label: 'Migration Safety', icon: <Database className="w-3.5 h-3.5" /> },
          { id: 'rollback', label: 'Rollback Engine', icon: <RotateCcw className="w-3.5 h-3.5" /> },
          { id: 'incidents', label: 'Incidents', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="mt-6 space-y-6">
        {/* Tab 1: Deployments */}
        {activeTab === 'deployments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-emerald-400" />
              Deployment Orchestration History
            </h3>
            {deployments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <Server className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No active deployment history recorded.</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Click "Orchestrate Deploy" to execute governed pre-flight checks and deployment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deployments.map((dep) => (
                  <div
                    key={dep.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-emerald-400">{dep.releaseVersion}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {dep.environment}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">[{dep.provider}]</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Git SHA: <span className="font-mono text-slate-300">{dep.gitSha}</span> • Initiated by:{' '}
                        <span className="text-slate-300">{dep.initiatedBy}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          dep.status === 'HEALTHY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : dep.status === 'NOT_CONFIGURED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : dep.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Release Gate */}
        {activeTab === 'release_gate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Production Release Gate Evidence
              </h3>
              <button
                onClick={handleEvaluateReleaseGate}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 cursor-pointer"
              >
                Evaluate Gate Decision
              </button>
            </div>

            {releaseGate ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-500 block">Current Gate Decision</span>
                    <span
                      className={`text-2xl font-black uppercase ${
                        releaseGate.decision === 'GO'
                          ? 'text-emerald-400'
                          : releaseGate.decision === 'NOT_CONFIGURED'
                          ? 'text-amber-400'
                          : 'text-rose-500'
                      }`}
                    >
                      {releaseGate.decision}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>
                      Git SHA: <span className="font-mono text-emerald-400">{releaseGate.gitSha}</span>
                    </div>
                    <div>Evaluated: {new Date(releaseGate.evaluatedAt).toLocaleTimeString()}</div>
                  </div>
                </div>

                {releaseGate.blockingReasons && releaseGate.blockingReasons.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                    <span className="font-bold block">Blocking Reasons:</span>
                    {releaseGate.blockingReasons.map((reason: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {Object.entries(releaseGate.checks || {}).map(([key, check]: [string, any]) => (
                    <div key={key} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                      {check.status === 'PASS' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-200 capitalize">{key}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{check.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                Click "Evaluate Gate Decision" to inspect real production readiness checks.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Secret Governance */}
        {activeTab === 'env_gov' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Environment Variable & Secret Governance
            </h3>

            {envReport ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300">
                    Environment Status: <span className="text-emerald-400 uppercase font-mono">{envReport.environment}</span>
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      envReport.isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {envReport.isReady ? 'CONFIGURED & READY' : `${envReport.missingRequiredCount} MISSING VARS`}
                  </span>
                </div>

                <div className="space-y-2">
                  {envReport.variables.map((v: any) => (
                    <div
                      key={v.key}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-mono text-xs font-bold text-slate-200">{v.key}</span>
                      <span
                        className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded ${
                          v.status === 'CONFIGURED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                Loading secret governance audit...
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Runtime Health */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Runtime Health & Observability Signals
            </h3>

            {healthData ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-500 block">Health Inspection Status</span>
                    <span className="text-xl font-black text-emerald-400">{healthData.status}</span>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>Endpoint: <span className="font-mono text-slate-200">{healthData.endpoint}</span></div>
                    <div>Latency: <span className="font-mono text-emerald-400">{healthData.latencyMs} ms</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <span className="font-bold text-slate-300 block">Unmeasured Metrics Policy Notice:</span>
                  <p className="text-slate-400 text-[11px]">
                    CPU, Memory, and Traffic metrics are marked <span className="font-mono text-amber-400">NOT_MEASURED</span> because container metrics are not exposed directly in this runtime. No fake numbers are generated.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                Inspecting runtime liveness...
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Migration Safety */}
        {activeTab === 'migrations' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Database Migration Safety Engine
            </h3>

            {migrationSafety ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300">
                    Pending Migrations:{' '}
                    <span className="text-emerald-400 font-bold">{migrationSafety.pendingMigrations.length}</span>
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      migrationSafety.hasDestructiveOperations
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {migrationSafety.hasDestructiveOperations ? 'DESTRUCTIVE OPERATIONS DETECTED' : 'ADDITIVE SAFE'}
                  </span>
                </div>

                {migrationSafety.pendingMigrations.map((m: any) => (
                  <div key={m.migrationName} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-mono font-bold text-slate-200">{m.migrationName}</span>
                    {m.isDestructive && (
                      <span className="ml-3 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                        Requires Confirmation: {m.destructiveOperations.join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                Checking migration safety...
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Rollback Engine */}
        {activeTab === 'rollback' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              Safe Rollback Engine
            </h3>

            {revisions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                No recorded revisions available for rollback.
              </div>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-400">{rev.revisionId}</span>
                      <span className="ml-2 text-[10px] text-slate-500">[{rev.gitSha}]</span>
                    </div>
                    <button
                      onClick={() => handleExecuteRollback(rev.revisionId)}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 font-bold text-xs transition-all cursor-pointer"
                    >
                      Rollback to Rev
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Incidents */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Operational Incidents History
            </h3>

            {incidents.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                No operational incidents recorded. System active and healthy.
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-400 uppercase">{inc.failureCategory}</span>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(inc.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-300">{inc.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
