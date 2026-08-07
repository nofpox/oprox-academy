import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  Workflow,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
  Play,
  RotateCcw,
  Sparkles,
  FileCode,
  Layers,
  Code2
} from 'lucide-react';
import { TerminalEmulator } from './TerminalEmulator';
import { FactoryPipeline } from './FactoryPipeline';
import { FactoryStage } from '../../types';

interface BottomDrawerProps {
  logs: string[];
  onExecuteCommand: (cmd: string) => void;
  onClearLogs: () => void;
  factoryStages: FactoryStage[];
  isPipelineRunning: boolean;
  onRunPipeline: () => void;
  theme?: 'dark' | 'light';
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  logs,
  onExecuteCommand,
  onClearLogs,
  factoryStages,
  isPipelineRunning,
  onRunPipeline,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'terminal' | 'console' | 'problems' | 'output'>('terminal');

  // Problems Mock Data
  const problemsList = [
    { id: 'p1', file: '/src/App.tsx', line: 42, col: 18, severity: 'warning', code: 'TS6133', message: "'theme' is declared but its value is never read." },
    { id: 'p2', file: '/src/services/aiAgentService.ts', line: 112, col: 8, severity: 'warning', code: 'ESLint', message: "Unused parameter 'vfsTree' in function signature." },
    { id: 'p3', file: '/src/components/showcase/ShowcaseView.tsx', line: 88, col: 24, severity: 'info', code: 'A11y', message: "Consider adding explicit aria-label to icon button." }
  ];

  return (
    <div className={`h-full flex flex-col border-t overflow-hidden select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
    }`}>
      {/* Drawer Header Tabs */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'terminal' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'console' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Console Log</span>
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'problems' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Problems ({problemsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'output' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-indigo-400" />
            <span>18-Stage Factory Output</span>
          </button>
        </div>

        <button
          onClick={onClearLogs}
          className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 cursor-pointer"
          title="Clear logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* 1. TERMINAL EMULATOR */}
        {activeTab === 'terminal' && (
          <div className="h-full">
            <TerminalEmulator
              logs={logs}
              onExecuteCommand={onExecuteCommand}
              onClearLogs={onClearLogs}
            />
          </div>
        )}

        {/* 2. CONSOLE LOG */}
        {activeTab === 'console' && (
          <div className="p-3 font-mono text-xs space-y-1 text-slate-300">
            <div className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider">
              Runtime Console Output
            </div>
            {logs.map((log, i) => (
              <div key={i} className="py-0.5 border-b border-slate-900/40">
                <span className="text-slate-500 select-none mr-2">[{i + 1}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}

        {/* 3. PROBLEMS PANEL */}
        {activeTab === 'problems' && (
          <div className="p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              <span>TypeScript & Linter Analysis</span>
              <span>0 Critical Errors • {problemsList.length} Warnings</span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              {problemsList.map((p) => (
                <div key={p.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-200">{p.file}:{p.line}:{p.col}</span>
                      <p className="text-slate-400 text-[10px]">{p.message}</p>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                    {p.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. 18-STAGE FACTORY OUTPUT */}
        {activeTab === 'output' && (
          <div className="h-full">
            <FactoryPipeline
              stages={factoryStages}
              isRunning={isPipelineRunning}
              onRunPipeline={onRunPipeline}
              onLogGenerated={() => {}}
            />
          </div>
        )}

      </div>
    </div>
  );
};
