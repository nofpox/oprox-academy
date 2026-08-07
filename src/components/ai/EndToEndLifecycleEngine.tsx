import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  Calendar,
  Workflow,
  BookOpen,
  Code2,
  FileDiff,
  ShieldAlert,
  Cpu,
  FileText,
  GitBranch,
  Terminal,
  Rocket,
  Cloud,
  Play,
  ArrowRight,
  Check,
  AlertTriangle
} from 'lucide-react';
import { LifecycleStage } from '../../types';

interface EndToEndLifecycleEngineProps {
  theme?: 'dark' | 'light';
  projectTitle?: string;
  onNavigateModule?: (moduleId: string) => void;
}

export const EndToEndLifecycleEngine: React.FC<EndToEndLifecycleEngineProps> = ({
  theme = 'dark',
  projectTitle = 'OPROX Autonomous System',
  onNavigateModule
}) => {
  const isDark = theme === 'dark';

  const [currentStage, setCurrentStage] = useState<LifecycleStage>('idea');
  const [isAutoExecuting, setIsAutoExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lifecycleState, setLifecycleState] = useState<{
    currentStage: LifecycleStage;
    stageOutputs: Record<string, { status: string; output?: string; error?: string }>;
  }>({
    currentStage: 'idea',
    stageOutputs: {}
  });

  const stages: { id: LifecycleStage; label: string; phase: string; icon: React.ReactNode; moduleId: string }[] = [
    { id: 'idea', label: 'Idea & Setup', phase: 'Phase 3', icon: <Sparkles className="w-3.5 h-3.5" />, moduleId: 'generator' },
    { id: 'requirements', label: 'Requirements', phase: 'Phase 1', icon: <BookOpen className="w-3.5 h-3.5" />, moduleId: 'spec_engine' },
    { id: 'planning', label: 'WBS Planning', phase: 'Phase 1', icon: <Calendar className="w-3.5 h-3.5" />, moduleId: 'planner' },
    { id: 'architecture', label: 'Architecture', phase: 'Phase 1', icon: <Compass className="w-3.5 h-3.5" />, moduleId: 'architect' },
    { id: 'tasks', label: 'Task Swarm', phase: 'Phase 3', icon: <Workflow className="w-3.5 h-3.5" />, moduleId: 'collaboration' },
    { id: 'code_generation', label: 'Code Gen', phase: 'Phase 2', icon: <Code2 className="w-3.5 h-3.5" />, moduleId: 'codegen' },
    { id: 'patching', label: 'Patching', phase: 'Phase 2', icon: <FileDiff className="w-3.5 h-3.5" />, moduleId: 'patch' },
    { id: 'testing', label: 'Vitest QA', phase: 'Phase 2', icon: <Cpu className="w-3.5 h-3.5" />, moduleId: 'test' },
    { id: 'security_review', label: 'OWASP Security', phase: 'Phase 2', icon: <ShieldAlert className="w-3.5 h-3.5" />, moduleId: 'review' },
    { id: 'documentation', label: 'Docs Suite', phase: 'Phase 2', icon: <FileText className="w-3.5 h-3.5" />, moduleId: 'doc' },
    { id: 'git', label: 'Git Sync', phase: 'Phase 3', icon: <GitBranch className="w-3.5 h-3.5" />, moduleId: 'sync' },
    { id: 'build', label: 'Build Engine', phase: 'Phase 3', icon: <Terminal className="w-3.5 h-3.5" />, moduleId: 'pipeline' },
    { id: 'release', label: 'Release Manager', phase: 'Phase 3', icon: <Rocket className="w-3.5 h-3.5" />, moduleId: 'release' },
    { id: 'deployment', label: 'Cloud Run Live', phase: 'Phase 3', icon: <Cloud className="w-3.5 h-3.5" />, moduleId: 'sync' }
  ];

  const fetchLifecycle = async () => {
    try {
      setError(null);
      const res = await fetch('/api/phase3/lifecycle');
      if (res.ok) {
        const data = await res.json();
        if (data.lifecycle) {
          setLifecycleState(data.lifecycle);
          setCurrentStage(data.lifecycle.currentStage || 'idea');
        }
      }
    } catch (err: any) {
      setError('Error connecting to lifecycle engine API.');
    }
  };

  useEffect(() => {
    fetchLifecycle();
  }, []);

  const currentStageIndex = stages.findIndex((s) => s.id === currentStage);

  const handleAutoExecuteLifecycle = async () => {
    setIsAutoExecuting(true);
    setError(null);
    try {
      const res = await fetch('/api/phase3/lifecycle/auto-run', { method: 'POST' });
      const data = await res.json();
      if (data.lifecycle) {
        setLifecycleState(data.lifecycle);
        setCurrentStage(data.lifecycle.currentStage);
      }
      if (!res.ok || data.success === false) {
        setError(data.message || data.error || 'Lifecycle auto-run stopped at blocking failure.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing lifecycle auto-run.');
    } finally {
      setIsAutoExecuting(false);
    }
  };

  const handleNavigate = (moduleId: string) => {
    if (onNavigateModule) onNavigateModule(moduleId);
  };

  const activeStageDetails = lifecycleState.stageOutputs?.[currentStage];

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">End-to-End Autonomous Project Lifecycle Engine</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Authoritative 14-Stage Orchestrator
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              IDEA → REQUIREMENTS → ARCHITECTURE → TASKS → CODE → PATCH → TEST → SECURITY → DOCS → RELEASE → DEPLOY
            </p>
          </div>
        </div>

        <button
          onClick={handleAutoExecuteLifecycle}
          disabled={isAutoExecuting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isAutoExecuting ? 'animate-spin' : ''}`} />
          <span>{isAutoExecuting ? 'Auto-Executing Lifecycle...' : 'Auto-Run Complete End-to-End Lifecycle'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 14 Lifecycle Stages Flow Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        {stages.map((st, i) => {
          const isActive = currentStage === st.id;
          const stageState = lifecycleState.stageOutputs?.[st.id];
          const isCompleted = stageState?.status === 'completed';
          const isFailed = stageState?.status === 'failed';

          return (
            <button
              key={st.id}
              onClick={() => setCurrentStage(st.id)}
              className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 font-extrabold'
                  : isFailed
                  ? 'bg-rose-950/60 border-rose-500/80 text-rose-300'
                  : isCompleted
                  ? 'bg-slate-900 border-slate-800 text-emerald-400'
                  : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono font-bold uppercase">{st.phase}</span>
                {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
              </div>
              <div className="flex items-center gap-1.5 truncate">
                {st.icon}
                <span className="text-xs font-bold truncate">{st.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-emerald-400">
              Active Stage [{currentStageIndex + 1}/14]: {stages[currentStageIndex]?.label}
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-950 text-slate-300">
              STATUS: {activeStageDetails?.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            {activeStageDetails?.output || activeStageDetails?.error || 'Lifecycle stage connected to authoritative backend engines.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNavigate(stages[currentStageIndex]?.moduleId || 'generator')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <span>Open Interactive Module View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
