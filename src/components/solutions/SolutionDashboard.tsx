import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Sparkles,
  Bot,
  Send,
  Film,
  Building2,
  Key,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { IndustrySolution, SolutionActivityLog } from '../../types';
import { MediaStudio } from '../verticals/MediaStudio';
import { PropTechStudio } from '../verticals/PropTechStudio';

interface SolutionDashboardProps {
  solutions: IndustrySolution[];
  activeSolutionId: string;
  onChangeActiveSolution: (id: string) => void;
  activityLogs: SolutionActivityLog[];
  theme?: 'dark' | 'light';
}

export const SolutionDashboard: React.FC<SolutionDashboardProps> = ({
  solutions,
  activeSolutionId,
  onChangeActiveSolution,
  activityLogs,
  theme = 'dark'
}) => {
  const activeSolution = solutions.find((s) => s.id === activeSolutionId) || solutions[0];

  // AI Assistant Chat State
  const [assistantInput, setAssistantInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello! I am your OPROX Solutions AI Assistant for ${activeSolution.name}. Ask me to generate storyboards, analyze property yields, or inspect maintenance logs.`,
      time: 'Just now'
    }
  ]);

  const handleSendAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;

    const userText = assistantInput;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time }]);
    setAssistantInput('');

    setTimeout(() => {
      let reply = `OPROX AI Assistant analyzed your request regarding "${userText}". All metrics for ${activeSolution.name} are running at optimal SLA parameters.`;

      if (activeSolution.id === 'sol-media-studio') {
        reply = `Media Studio AI Engine generated prompt specs for "${userText}". 4K rendering ready in Media Assets queue.`;
      } else if (activeSolution.id === 'sol-real-estate' || activeSolution.id === 'sol-prop-management') {
        reply = `PropTech Analytics evaluated "${userText}". Projected yield increase is +2.4% with zero pending tenant work orders.`;
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 600);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Active Solution Selector Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeSolution.bannerGradient} flex items-center justify-center text-white font-bold shadow`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-white">
                {activeSolution.name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeSolution.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {activeSolution.tagline}
            </p>
          </div>
        </div>

        {/* Switch Active App Pill Menu */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-slate-400 hidden md:inline">Switch Active App:</span>
          {solutions.filter((s) => s.isInstalled).map((s) => (
            <button
              key={s.id}
              onClick={() => onChangeActiveSolution(s.id)}
              className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition-all whitespace-nowrap ${
                s.id === activeSolution.id
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{activeSolution.activeUsers}</p>
          <p className="text-[10px] text-emerald-400 font-mono">+12% active seats</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Monthly Value Yield</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{activeSolution.monthlySavings}</p>
          <p className="text-[10px] text-emerald-400 font-mono">Cost reduction metric</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>SLA Uptime Health</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white">99.98%</p>
          <p className="text-[10px] text-cyan-400 font-mono">0 incidents past 30 days</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AI Inference Load</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400">1.4ms</p>
          <p className="text-[10px] text-indigo-400 font-mono">Gemini Flash sub-routine</p>
        </div>
      </div>

      {/* Main Solution Workspace Component Embed */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
        {activeSolution.id === 'sol-media-studio' ? (
          <MediaStudio />
        ) : activeSolution.id === 'sol-real-estate' || activeSolution.id === 'sol-prop-management' ? (
          <PropTechStudio />
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${activeSolution.bannerGradient} flex items-center justify-center text-white shadow-lg`}>
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white">{activeSolution.name} Studio Workspace</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              {activeSolution.description}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-mono font-bold">
                Status: {activeSolution.status}
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-mono font-bold">
                Version: {activeSolution.version}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Recent Activity Stream + Solution AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Log Stream */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Recent Activity & Audit Stream</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Live Telemetry</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-bold">{log.user}</span>
                  <span className="text-slate-500">{log.timestamp}</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-snug">{log.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contextual AI Assistant Panel */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Solution AI Assistant</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Contextual Bot
            </span>
          </div>

          {/* Chat Messages */}
          <div className="space-y-3 max-h-48 overflow-y-auto font-mono text-xs p-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border space-y-1 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-200 ml-6'
                    : 'bg-slate-950 border-slate-800 text-slate-200 mr-6'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>{msg.sender === 'user' ? 'You' : 'Solution AI Bot'}</span>
                  <span>{msg.time}</span>
                </div>
                <p className="text-[11px] leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendAssistant} className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              placeholder={`Ask AI Assistant about ${activeSolution.name}...`}
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
