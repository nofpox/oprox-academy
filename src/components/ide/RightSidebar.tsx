import React, { useState } from 'react';
import {
  MessageSquare,
  Bot,
  Eye,
  Send,
  Sparkles,
  Zap,
  Terminal,
  RefreshCw,
  Maximize2,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Globe,
  Lock
} from 'lucide-react';
import { AgentConsole } from './AgentConsole';
import { AgentMessage, AgentRole } from '../../types';
import { AGENTS } from '../../data/mockData';

interface RightSidebarProps {
  messages: AgentMessage[];
  onDispatchTask: (role: AgentRole, prompt: string) => void;
  isProcessing: boolean;
  onApplyGeneratedCode: (code: string) => void;
  theme?: 'dark' | 'light';
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  messages,
  onDispatchTask,
  isProcessing,
  onApplyGeneratedCode,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'chat' | 'agents' | 'preview'>('chat');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  const handleRefreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  return (
    <div className={`h-full flex flex-col border-l overflow-hidden select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
    }`}>
      {/* Icon Tab Navigation Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 bg-slate-900 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            title="AI Multi-Agent Chat"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'chat' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('agents')}
            title="Agent Status Monitor"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'agents' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            title="Live Container Preview"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'preview' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          {activeTab}
        </span>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto">
        
        {/* 1. AI CHAT PANEL */}
        {activeTab === 'chat' && (
          <div className="h-full">
            <AgentConsole
              messages={messages}
              onDispatchTask={onDispatchTask}
              isProcessing={isProcessing}
              onApplyGeneratedCode={onApplyGeneratedCode}
            />
          </div>
        )}

        {/* 2. AGENT STATUS PANEL */}
        {activeTab === 'agents' && (
          <div className="p-3 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono">
                Autonomous AI Agent Swarm (6 Roles)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Operational</span>
            </div>

            <div className="space-y-3">
              {AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{agent.avatar}</span>
                      <div>
                        <h4 className="font-bold text-xs">{agent.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{agent.title}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      {agent.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {agent.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[10px] font-mono text-slate-500">
                    <span>Specialty: {agent.specialty}</span>
                    <span>CPU: 2%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. LIVE PREVIEW PANEL */}
        {activeTab === 'preview' && (
          <div className="h-full flex flex-col space-y-2 p-3">
            {/* Viewport bar */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                <Lock className="w-3 h-3" />
                <span>http://localhost:3000</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setPreviewViewport('desktop')}
                    className={`p-1 rounded cursor-pointer ${previewViewport === 'desktop' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500'}`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('tablet')}
                    className={`p-1 rounded cursor-pointer ${previewViewport === 'tablet' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500'}`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewViewport('mobile')}
                    className={`p-1 rounded cursor-pointer ${previewViewport === 'mobile' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500'}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleRefreshPreview}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  title="Reload Preview"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Viewport Frame */}
            <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center p-2">
              <div
                key={previewKey}
                className={`h-full bg-slate-950 rounded-lg border border-slate-800 flex flex-col overflow-hidden transition-all ${
                  previewViewport === 'desktop' ? 'w-full' : previewViewport === 'tablet' ? 'w-[80%]' : 'w-[55%]'
                }`}
              >
                <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Container Health: 200 OK</span>
                  </div>
                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-emerald-400 hover:underline"
                  >
                    <span>Open Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex-1 w-full bg-white relative">
                  <iframe
                    src="/"
                    title="Live App Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
