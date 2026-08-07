import React, { useState } from 'react';
import { 
  Cloud, 
  Activity, 
  Cpu, 
  HardDrive, 
  RotateCcw, 
  CheckCircle2, 
  Server, 
  Globe, 
  ShieldCheck, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

const METRIC_TIMELINE = [
  { time: '10:00', cpu: 12, memoryMb: 142, reqPerSec: 1200, latencyMs: 24 },
  { time: '10:05', cpu: 18, memoryMb: 156, reqPerSec: 1450, latencyMs: 28 },
  { time: '10:10', cpu: 24, memoryMb: 168, reqPerSec: 1890, latencyMs: 32 },
  { time: '10:15', cpu: 15, memoryMb: 152, reqPerSec: 1320, latencyMs: 26 },
  { time: '10:20', cpu: 14, memoryMb: 148, reqPerSec: 1280, latencyMs: 25 },
  { time: '10:25', cpu: 16, memoryMb: 154, reqPerSec: 1420, latencyMs: 27 },
];

const BACKUP_SNAPSHOTS = [
  { id: 'snap_420', timestamp: '2026-07-30 01:15 UTC', sizeMb: 48.2, status: 'Verified', gitHash: 'a81f3d9' },
  { id: 'snap_419', timestamp: '2026-07-29 18:00 UTC', sizeMb: 47.9, status: 'Verified', gitHash: 'b49c2e1' },
  { id: 'snap_418', timestamp: '2026-07-28 12:00 UTC', sizeMb: 46.5, status: 'Verified', gitHash: 'c12a9f4' },
];

export const CloudMonitors: React.FC = () => {
  const [isRollbackRunning, setIsRollbackRunning] = useState(false);
  const [activeSnapshot, setActiveSnapshot] = useState('snap_420');

  const handleTriggerRollback = (id: string) => {
    setIsRollbackRunning(true);
    setTimeout(() => {
      setActiveSnapshot(id);
      setIsRollbackRunning(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>OPROX Deployment Monitors & Cloud Backup</span>
            </h1>
            <p className="text-xs text-slate-400">
              Live container health, telemetry charts, zero-downtime Cloud Run service metrics, and automated snapshot rollbacks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Region: europe-west2 (Cloud Run)</span>
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>CPU Utilization</span>
          </p>
          <p className="text-2xl font-black text-white">16%</p>
          <p className="text-[10px] text-emerald-400">Optimal allocation</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Memory Footprint</span>
          </p>
          <p className="text-2xl font-black text-white">154 MB</p>
          <p className="text-[10px] text-emerald-400">512 MB Container Limit</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Traffic Throughput</span>
          </p>
          <p className="text-2xl font-black text-white">1,420 RPS</p>
          <p className="text-[10px] text-emerald-400">Auto-scaled 4 instances</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Average Latency</span>
          </p>
          <p className="text-2xl font-black text-white">27 ms</p>
          <p className="text-[10px] text-emerald-400">p99 = 42ms</p>
        </div>
      </div>

      {/* Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-sm">Real-time Throughput (Req / Sec)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={METRIC_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="reqPerSec" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-sm">Container Memory Usage (MB)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={METRIC_TIMELINE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="memoryMb" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Backup Snapshots & One-Click Rollback */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Cloud Backup Snapshots & State Rollback</h3>
            <p className="text-xs text-slate-400">Cryptographically signed environment snapshots taken automatically after each 18-stage pipeline run.</p>
          </div>
          <span className="text-xs font-mono text-emerald-400">Active Snapshot: {activeSnapshot}</span>
        </div>

        <div className="space-y-2">
          {BACKUP_SNAPSHOTS.map((snap) => {
            const isActive = activeSnapshot === snap.id;
            return (
              <div
                key={snap.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                    : 'bg-slate-950 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 font-mono text-xs font-bold">
                    {snap.id}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white">{snap.timestamp}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Git Commit: {snap.gitHash} | Size: {snap.sizeMb} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isActive ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Live Production</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTriggerRollback(snap.id)}
                      disabled={isRollbackRunning}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Rollback to This</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
