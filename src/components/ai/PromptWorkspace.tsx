import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Play,
  RotateCcw,
  BookOpen,
  Paperclip,
  Code2,
  Cpu,
  Layers,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import { ModelConfig, PromptTemplate, ContextItem } from '../../types';

interface PromptWorkspaceProps {
  modelConfig: ModelConfig;
  onChangeModelConfig: (newConfig: ModelConfig) => void;
  promptText: string;
  onChangePromptText: (text: string) => void;
  templates: PromptTemplate[];
  onSelectTemplate: (template: PromptTemplate) => void;
  contextItems: ContextItem[];
  onRunSwarm: () => void;
  isProcessing: boolean;
  theme?: 'dark' | 'light';
}

export const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({
  modelConfig,
  onChangeModelConfig,
  promptText,
  onChangePromptText,
  templates,
  onSelectTemplate,
  contextItems,
  onRunSwarm,
  isProcessing,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  // Calculate tokens
  const totalTokens = contextItems
    .filter((c) => c.isSelected)
    .reduce((acc, curr) => acc + curr.tokenCount, 0) + Math.round(promptText.length / 4);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`h-full flex flex-col border-r overflow-hidden select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      {/* Workspace Header - AI Studio Style */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm tracking-wide text-white">
              Prompt & Agent Workspace
            </h2>
            <span className="text-[10px] text-emerald-400 font-mono">
              Google AI Studio Paradigm • Swarm Orchestrator
            </span>
          </div>
        </div>

        {/* Model Selector & Parameters Toggle */}
        <div className="flex items-center gap-2">
          {/* Model Alias Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono font-bold text-[11px]">
            <Cpu className="w-3.5 h-3.5" />
            <span>{modelConfig.modelName}</span>
          </div>

          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              showConfigDrawer
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Parameters</span>
            {showConfigDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Model Configuration Drawer (Collapsible) */}
      {showConfigDrawer && (
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Temperature</span>
              <span className="text-emerald-400 font-bold">{modelConfig.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={modelConfig.temperature}
              onChange={(e) =>
                onChangeModelConfig({ ...modelConfig, temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Top P */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Top P</span>
              <span className="text-emerald-400 font-bold">{modelConfig.topP}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={modelConfig.topP}
              onChange={(e) =>
                onChangeModelConfig({ ...modelConfig, topP: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Max Output Tokens */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Max Tokens</span>
              <span className="text-emerald-400 font-bold">{modelConfig.maxOutputTokens}</span>
            </div>
            <input
              type="range"
              min="1024"
              max="32768"
              step="1024"
              value={modelConfig.maxOutputTokens}
              onChange={(e) =>
                onChangeModelConfig({ ...modelConfig, maxOutputTokens: parseInt(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* System Instruction */}
          <div className="md:col-span-3 space-y-1 pt-2 border-t border-slate-800">
            <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              System Instruction
            </label>
            <textarea
              value={modelConfig.systemInstruction}
              onChange={(e) =>
                onChangeModelConfig({ ...modelConfig, systemInstruction: e.target.value })
              }
              rows={2}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Main Prompt Input Area */}
      <div className="flex-1 p-4 flex flex-col space-y-4 overflow-y-auto">
        {/* Prompt Header Controls */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            User Specification Prompt
          </span>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Tokens: <strong className="text-emerald-400">{totalTokens.toLocaleString()}</strong> / 1,000,000</span>
            <button
              onClick={handleCopyPrompt}
              className="hover:text-white cursor-pointer p-1 rounded hover:bg-slate-800"
              title="Copy Prompt"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative flex flex-col">
          <textarea
            value={promptText}
            onChange={(e) => onChangePromptText(e.target.value)}
            placeholder="Describe what you want the Multi-Agent Swarm to build (e.g. 'Build a real-time collaborative whiteboarding API with PostgreSQL schema, Vitest tests, and Cloud Run deployment manifest')..."
            className="w-full h-full min-h-[160px] p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-none"
          />

          {/* Run Button floating bar */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">
                Variables: <code className="text-indigo-400">{"{{service_name}}"}</code> supported
              </span>
            </div>

            <button
              onClick={onRunSwarm}
              disabled={isProcessing || !promptText.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isProcessing ? 'Swarm Executing...' : 'Dispatch Multi-Agent Swarm'}</span>
            </button>
          </div>
        </div>

        {/* Prompt Templates Quick Switcher */}
        <div className="space-y-2 pt-3 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Prompt Library & Blueprints ({templates.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => onSelectTemplate(tmpl)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-emerald-500/30 text-left transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {tmpl.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {tmpl.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">
                  {tmpl.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
