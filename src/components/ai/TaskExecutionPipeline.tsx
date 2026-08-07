import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  RotateCcw,
  AlertTriangle,
  Clock,
  Ban,
  Check,
  RefreshCw
} from 'lucide-react';
import { PipelineTaskNode } from '../../types';

interface TaskExecutionPipelineProps {
  theme?: 'dark' | 'light';
  projectTitle?: string;
}

export const TaskExecutionPipeline: React.FC<TaskExecutionPipelineProps> = ({
  theme = 'dark',
  projectTitle = 'OPROX Project Workspace'
}) => {
  const isDark = theme === 'dark';

  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<PipelineTaskNode[]>([]);

  const fetchPipelineTasks = async () => {
    try {
      setError(null);
      const res = await fetch('/api/phase3/pipeline');
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) setTasks(data.tasks);
      }
    } catch (err: any) {
      setError('Error connecting to pipeline DAG API.');
    }
  };

  useEffect(() => {
    fetchPipelineTasks();
  }, []);

  const handleStartPipeline = async () => {
    setIsPipelineRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/phase3/pipeline/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) setTasks(data.tasks);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to run pipeline.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing pipeline queue.');
    } finally {
      setIsPipelineRunning(false);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    setError(null);
    try {
      const res = await fetch('/api/phase3/pipeline/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) setTasks(data.tasks);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to retry task.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error retrying pipeline task.');
    }
  };

  const handleCancelTask = async (taskId: string) => {
    setError(null);
    try {
      const res = await fetch('/api/phase3/pipeline/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) setTasks(data.tasks);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to cancel task.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error cancelling task.');
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const filteredTasks = tasks.filter((t) => filterStatus === 'all' || t.status === filterStatus);

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/25">
            <Workflow className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Task Execution Pipeline & DAG Engine</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Persistent DAG Queue
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Server-Backed Dependency Scheduling • Exponential Backoff Retries • Concurrent DAG Node Execution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartPipeline}
            disabled={isPipelineRunning}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isPipelineRunning ? 'animate-spin' : ''}`} />
            <span>{isPipelineRunning ? 'Executing Pipeline Tasks...' : 'Run Pipeline Queue'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Bar & Stats */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 mb-6">
        <div className="flex items-center justify-between text-xs font-mono font-bold">
          <span className="text-slate-400 uppercase">Pipeline Progress: {progressPercent}% Completed</span>
          <span className="text-teal-400">{completedCount} of {tasks.length} Tasks Succeeded</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/60 mb-6">
        {['all', 'pending', 'running', 'completed', 'failed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Task Queue Node Cards */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-mono">No tasks match selected filter.</div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all ${
                task.status === 'running'
                  ? 'bg-teal-950/40 border-teal-500/60 shadow-lg shadow-teal-500/10'
                  : task.status === 'completed'
                  ? 'bg-slate-900 border-slate-800 opacity-90'
                  : 'bg-slate-950 border-slate-800/80'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl text-slate-950 font-bold ${
                    task.status === 'completed' ? 'bg-emerald-500' :
                    task.status === 'running' ? 'bg-teal-400 animate-pulse' :
                    task.status === 'failed' ? 'bg-rose-500' :
                    task.status === 'cancelled' ? 'bg-slate-600' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {task.status === 'completed' && <Check className="w-4 h-4" />}
                    {task.status === 'running' && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {task.status === 'pending' && <Clock className="w-4 h-4" />}
                    {task.status === 'failed' && <AlertTriangle className="w-4 h-4" />}
                    {task.status === 'cancelled' && <Ban className="w-4 h-4" />}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-100">{task.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-teal-300">
                        {task.assignedAgent}
                      </span>
                    </div>
                    {task.output && <p className="text-[11px] font-mono text-slate-400 mt-1">{task.output}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.status === 'running' && (
                    <button
                      onClick={() => handleCancelTask(task.id)}
                      className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer hover:bg-rose-500/30 transition-all"
                    >
                      Cancel
                    </button>
                  )}

                  {(task.status === 'failed' || task.status === 'cancelled') && (
                    <button
                      onClick={() => handleRetryTask(task.id)}
                      className="px-3 py-1 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-teal-400 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retry
                    </button>
                  )}

                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {task.completedAt || task.startedAt || 'Queued'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
