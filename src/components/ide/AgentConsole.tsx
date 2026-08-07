import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Code2, 
  Terminal, 
  ShieldCheck, 
  Brain, 
  Zap, 
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { Agent, AgentMessage, AgentRole } from '../../types';
import { AGENTS } from '../../data/mockData';

interface AgentConsoleProps {
  messages: AgentMessage[];
  onDispatchTask: (agentRole: AgentRole, prompt: string) => void;
  isProcessing: boolean;
  onApplyGeneratedCode: (code: string) => void;
}

const QUICK_PROMPTS = [
  'Add JWT Auth middleware with rate limiting',
  'Refactor state management in App.tsx',
  'Design database schema for users and orders',
  'Write unit tests for aiAgentService.ts',
];

export const AgentConsole: React.FC<AgentConsoleProps> = ({
  messages,
  onDispatchTask,
  isProcessing,
  onApplyGeneratedCode,
}) => {
  const [selectedAgentRole, setSelectedAgentRole] = useState<AgentRole>('Planner');
  const [promptInput, setPromptInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeAgentInfo = AGENTS.find((a) => a.id === selectedAgentRole) || AGENTS[0];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isProcessing) return;
    onDispatchTask(selectedAgentRole, promptInput.trim());
    setPromptInput('');
  };

  const handleQuickPromptClick = (qp: string) => {
    setPromptInput(qp);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-800 text-slate-200">
      {/* Header & Agent Role Switcher */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Autonomous AI Agent Team
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {isProcessing ? 'Agent Thinking...' : 'Ready'}
          </span>
        </div>

        {/* Agent Role Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {AGENTS.map((agent) => {
            const isSelected = selectedAgentRole === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentRole(agent.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? `${agent.bgLight} text-white border ${agent.borderAccent}`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{agent.avatar}</span>
                <span>{agent.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Agent Banner */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">{activeAgentInfo.avatar}</span>
          <div>
            <p className="font-bold text-white text-[11px]">{activeAgentInfo.name}</p>
            <p className="text-[10px] text-slate-400">{activeAgentInfo.title}</p>
          </div>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono">Gemini 3.6 Flash</span>
      </div>

      {/* Chat Messages / Thought Stream List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Select an agent role and submit a feature prompt. The AI agent will plan, generate code, write tests, and propose system changes.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const agentMeta = AGENTS.find((a) => a.id === msg.agentRole) || AGENTS[0];

            return (
              <div key={msg.id} className="space-y-2 text-xs">
                {/* Agent Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{agentMeta.avatar}</span>
                    <span className="font-bold text-slate-200">{msg.agentRole}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                </div>

                {/* Agent Thought Box */}
                {msg.thought && (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 font-mono text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px] uppercase">
                      <Zap className="w-3 h-3" />
                      <span>Internal Thought Stream</span>
                    </div>
                    <p className="leading-relaxed opacity-90">{msg.thought}</p>
                  </div>
                )}

                {/* Main Content / Response */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-slate-200">
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Plan Steps */}
                  {msg.plan && msg.plan.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Execution Plan:</p>
                      <ul className="space-y-1 text-[11px] text-slate-300">
                        {msg.plan.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Generated Code Snippet */}
                  {msg.codeSnippet && (
                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
                          <Code2 className="w-3 h-3" />
                          <span>Generated Code Patch</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyCode(msg.id, msg.codeSnippet!)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => onApplyGeneratedCode(msg.codeSnippet!)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Apply Code</span>
                          </button>
                        </div>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-48">
                        {msg.codeSnippet}
                      </pre>
                    </div>
                  )}

                  {/* Review Notes */}
                  {msg.reviewNotes && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                      <span>{msg.reviewNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-slate-900/80 border-t border-slate-800 space-y-1.5">
        <p className="text-[10px] uppercase font-bold text-slate-400">Quick Agent Prompts:</p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPromptClick(qp)}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700/80 cursor-pointer transition-colors"
            >
              + {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
        <div className="relative">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={`Instruct OPROX-${selectedAgentRole}...`}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="submit"
            disabled={!promptInput.trim() || isProcessing}
            className={`absolute right-2.5 bottom-2.5 p-2 rounded-lg font-bold transition-all ${
              promptInput.trim() && !isProcessing
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>
    </div>
  );
};
