import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  CheckCircle2,
  Clock,
  Code2,
  Terminal,
  Play,
  RotateCcw,
  Zap,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Layers,
  FileCode,
  Copy,
  Check,
  Pause
} from 'lucide-react';
import { AgentMessage, AgentRole, Agent } from '../../types';
import { AGENTS } from '../../data/mockData';

interface MultiAgentWorkspaceProps {
  messages: AgentMessage[];
  onDispatchTask: (role: AgentRole, prompt: string) => void;
  isProcessing: boolean;
  onApplyGeneratedCode?: (code: string) => void;
  theme?: 'dark' | 'light';
}

export const MultiAgentWorkspace: React.FC<MultiAgentWorkspaceProps> = ({
  messages,
  onDispatchTask,
  isProcessing,
  onApplyGeneratedCode,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAgentRole, setSelectedAgentRole] = useState<AgentRole | 'All'>('All');

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMessages = selectedAgentRole === 'All'
    ? messages
    : messages.filter((m) => m.agentRole === selectedAgentRole);

  return (
    <div className={`h-full flex flex-col border-r overflow-hidden select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      {/* Active Agents Ribbon Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-white uppercase tracking-wider text-[11px] font-mono">
              Multi-Agent Collaboration Swarm
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            6 Agents Online
          </span>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {AGENTS.map((agent) => {
            const isSelected = selectedAgentRole === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentRole(isSelected ? 'All' : agent.id)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{agent.avatar}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-[11px] truncate">{agent.name}</h4>
                  <span className="text-[9px] text-slate-400 font-mono block truncate">{agent.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation & Collaboration Timeline Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-bold">
          <span>Swarm Execution Timeline</span>
          <span>Filter: <strong className="text-emerald-400">{selectedAgentRole}</strong></span>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Bot className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No activity logged for {selectedAgentRole}. Dispatch a prompt to trigger swarm reasoning.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const agentMeta = AGENTS.find((a) => a.id === msg.agentRole) || AGENTS[0];

            return (
              <div
                key={msg.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3 relative group"
              >
                {/* Agent Avatar & Role Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{agentMeta.avatar}</span>
                    <div>
                      <span className="font-bold text-xs text-slate-200">{agentMeta.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2 font-normal">({agentMeta.title})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Thought Stream */}
                {msg.thought && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">
                      🧠 Agent Thought Process
                    </span>
                    <p className="italic leading-relaxed">{msg.thought}</p>
                  </div>
                )}

                {/* Content Message */}
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {msg.content}
                </p>

                {/* Plan Checklist */}
                {msg.plan && msg.plan.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sub-Routine Plan:
                    </span>
                    <div className="space-y-1 pl-2">
                      {msg.plan.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Snippet Box */}
                {msg.codeSnippet && (
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Synthesized AST Code Block</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyCode(msg.id, msg.codeSnippet!)}
                          className="hover:text-white cursor-pointer flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        {onApplyGeneratedCode && (
                          <button
                            onClick={() => onApplyGeneratedCode(msg.codeSnippet!)}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold cursor-pointer"
                          >
                            Apply to Editor
                          </button>
                        )}
                      </div>
                    </div>

                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                      {msg.codeSnippet}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
