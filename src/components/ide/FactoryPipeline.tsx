import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  ChevronRight, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Check,
  Zap
} from 'lucide-react';
import { FactoryStage } from '../../types';

interface FactoryPipelineProps {
  stages: FactoryStage[];
  isRunning: boolean;
  onRunPipeline: () => void;
  onLogGenerated: (log: string) => void;
}

export const FactoryPipeline: React.FC<FactoryPipelineProps> = ({
  stages,
  isRunning,
  onRunPipeline,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<number>(1);

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  const totalDuration = stages.reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="h-full flex flex-col bg-slate-950 border-t border-slate-800 text-slate-200">
      {/* Top Header Controls */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
            18
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              18-Stage Automated Software Factory
            </h3>
            <p className="text-[10px] text-slate-400">
              Complete automated build pipeline from requirement spec to live release
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">Total Duration:</span>
            <span className="text-emerald-400 font-bold">{(totalDuration / 1000).toFixed(2)}s</span>
          </div>

          <button
            onClick={onRunPipeline}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isRunning
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 shadow-emerald-500/10'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Running Pipeline ({progressPercent}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run 18-Stage Factory Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-900 w-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Pipeline Grid & Detail View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
        {/* Horizontal/Vertical Stage Cards Grid */}
        <div className="lg:col-span-2 p-3 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {stages.map((stage) => {
            const isSelected = selectedStageId === stage.id;
            let statusColor = 'border-slate-800 bg-slate-900/60 text-slate-400';
            let icon = <Clock className="w-3.5 h-3.5 text-slate-500" />;

            if (stage.status === 'completed') {
              statusColor = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300';
              icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
            } else if (stage.status === 'running') {
              statusColor = 'border-amber-500/50 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/40';
              icon = <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
            } else if (stage.status === 'failed') {
              statusColor = 'border-rose-500/40 bg-rose-500/10 text-rose-300';
              icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
            }

            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between gap-2 hover:border-slate-700 ${statusColor} ${
                  isSelected ? 'ring-2 ring-emerald-500/50 scale-[1.01]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300">
                    Stage {stage.id}
                  </span>
                  {icon}
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs truncate">{stage.name}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{stage.category}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/60 text-slate-500">
                  <span>{stage.status}</span>
                  <span>{stage.durationMs ? `${stage.durationMs}ms` : '--'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail & Live Logs */}
        <div className="p-4 bg-slate-950 flex flex-col justify-between space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
                Stage {selectedStage.id}: {selectedStage.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {selectedStage.category}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              {selectedStage.description}
            </p>

            <div className="space-y-1">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Stage Execution Logs ({selectedStage.logs.length})
              </h5>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto">
                {selectedStage.logs.map((log, i) => (
                  <div key={i} className="text-slate-300 leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Auto-remediation telemetry info */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>OPROX Auto-Remediation Active</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Automated lint, syntax error, and migration safety locks are evaluated continuously during execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
