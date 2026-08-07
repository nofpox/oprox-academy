import React from 'react';
import {
  ListTodo,
  Workflow,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Bot
} from 'lucide-react';
import { AITaskItem } from '../../types';

interface TaskPipelinePanelProps {
  tasks: AITaskItem[];
  isPipelineRunning: boolean;
  onRunPipeline: () => void;
  theme?: 'dark' | 'light';
}

export const TaskPipelinePanel: React.FC<TaskPipelinePanelProps> = ({
  tasks,
  isPipelineRunning,
  onRunPipeline,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = Math.round((completedCount / (tasks.length || 1)) * 100);

  return (
    <div className={`h-full flex flex-col border-t overflow-hidden select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      {/* Panel Header */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Workflow className="w-4 h-4 text-emerald-400" />
            <span>Tasks Queue & Execution Pipeline</span>
          </div>

          <span className="text-slate-500">|</span>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Progress:</span>
            <div className="w-28 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-emerald-400 font-bold">{progressPercent}%</span>
          </div>
        </div>

        <button
          onClick={onRunPipeline}
          disabled={isPipelineRunning}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 cursor-pointer disabled:opacity-50 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-slate-950" />
          <span>{isPipelineRunning ? 'Executing Tasks...' : 'Execute All Tasks'}</span>
        </button>
      </div>

      {/* Tasks Queue Grid */}
      <div className="flex-1 p-3 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
        {tasks.map((task) => {
          return (
            <div
              key={task.id}
              className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                task.status === 'completed'
                  ? 'bg-slate-900/40 border-slate-800/80'
                  : task.status === 'in_progress'
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                    {task.assignedAgent}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    task.priority === 'critical'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <p className="font-bold text-slate-200 text-[11px] leading-snug">
                  {task.title}
                </p>
              </div>

              {task.outputSnippet && (
                <p className="text-[10px] text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800/80 italic line-clamp-2">
                  {task.outputSnippet}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {task.status === 'in_progress' && <Clock className="w-3 h-3 text-emerald-400 animate-spin" />}
                  {task.status === 'pending' && <AlertCircle className="w-3 h-3 text-slate-500" />}
                  <span className="capitalize">{task.status.replace('_', ' ')}</span>
                </span>
                <span>ID: {task.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
