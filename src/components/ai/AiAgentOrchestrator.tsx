import React, { useState } from 'react';
import {
  Bot,
  Workflow,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Layers,
  History,
  Database,
  ArrowRight,
  ShieldCheck,
  Terminal,
  FileCode
} from 'lucide-react';
import { AgentRole, AgentMessage, AITaskItem } from '../../types';

interface AiAgentOrchestratorProps {
  projectTitle?: string;
  theme?: 'dark' | 'light';
}

export const AiAgentOrchestrator: React.FC<AiAgentOrchestratorProps> = ({
  projectTitle = 'OPROX Autonomous System',
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'pipeline' | 'routing' | 'queue' | 'context' | 'history'>('pipeline');
  const [isRunning, setIsRunning] = useState(false);
  const [orchestratorPrompt, setOrchestratorPrompt] = useState(
    'Implement a scalable rate-limiting API route with Redis, write Vitest tests, and generate Cloud Run Dockerfile.'
  );

  // 6 Specialized Agent Roles
  const agents: { role: AgentRole; title: string; color: string; desc: string }[] = [
    { role: 'Planner', title: 'Lead System Planner', color: 'from-amber-500 to-orange-600', desc: 'Deconstructs features into actionable execution tasks.' },
    { role: 'Architect', title: 'Software Architect', color: 'from-indigo-500 to-purple-600', desc: 'Designs system topology, schemas, and API contracts.' },
    { role: 'Coder', title: 'Senior Software Engineer', color: 'from-emerald-500 to-teal-600', desc: 'Synthesizes production TypeScript code and modules.' },
    { role: 'Reviewer', title: 'Security & Code Auditor', color: 'from-rose-500 to-pink-600', desc: 'Audits vulnerabilities, edge cases, and technical debt.' },
    { role: 'Tester', title: 'QA & Test Engineer', color: 'from-cyan-500 to-blue-600', desc: 'Writes unit and integration test coverage suites.' },
    { role: 'DevOps', title: 'Cloud Infrastructure Lead', color: 'from-violet-500 to-indigo-600', desc: 'Generates container definitions and deployment manifests.' },
  ];

  const [executionQueue, setExecutionQueue] = useState<AITaskItem[]>([
    { id: 'q1', title: 'Deconstruct prompt into engineering sub-tasks', assignedAgent: 'Planner', status: 'completed', priority: 'critical' },
    { id: 'q2', title: 'Generate Drizzle PostgreSQL schema & API contract', assignedAgent: 'Architect', status: 'completed', priority: 'high' },
    { id: 'q3', title: 'Synthesize rateLimiterMiddleware.ts in TypeScript', assignedAgent: 'Coder', status: 'in_progress', priority: 'critical' },
    { id: 'q4', title: 'Audit code against OWASP Top 10 API vulnerabilities', assignedAgent: 'Reviewer', status: 'pending', priority: 'high' },
    { id: 'q5', title: 'Generate Vitest integration test cases', assignedAgent: 'Tester', status: 'pending', priority: 'medium' },
    { id: 'q6', title: 'Generate Dockerfile & Cloud Run YAML deployment spec', assignedAgent: 'DevOps', status: 'pending', priority: 'low' },
  ]);

  const [executionLogs, setExecutionLogs] = useState<AgentMessage[]>([
    {
      id: 'log-1',
      agentRole: 'Planner',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      thought: 'Requirement parsed. Target domain requires Express middleware + Redis token bucket.',
      content: 'Planned 6 execution steps across multi-agent swarm.',
      plan: ['1. Architecture spec', '2. Code generation', '3. QA test cases', '4. Dockerfile build']
    },
    {
      id: 'log-2',
      agentRole: 'Architect',
      timestamp: new Date(Date.now() - 180000).toLocaleTimeString(),
      thought: 'Architecting Redis Sliding Window log algorithm with Express integration.',
      content: 'Interface definition ready: rateLimiter({ windowMs, maxRequests })',
      codeSnippet: `export interface RateLimitOptions {\n  windowMs: number;\n  maxRequests: number;\n}`
    },
    {
      id: 'log-3',
      agentRole: 'Coder',
      timestamp: new Date().toLocaleTimeString(),
      thought: 'Synthesizing production TypeScript rate limiter using atomic Redis pipeline.',
      content: 'Generated rateLimiterMiddleware.ts successfully with 0 errors.',
      codeSnippet: `import { Request, Response, NextFunction } from 'express';\nimport { redisClient } from './redis';\n\nexport async function rateLimiter(req: Request, res: Response, next: NextFunction) {\n  const ip = req.ip;\n  const current = await redisClient.incr(\`rate:\${ip}\`);\n  if (current === 1) await redisClient.expire(\`rate:\${ip}\`, 60);\n  if (current > 100) return res.status(429).json({ error: 'Too Many Requests' });\n  next();\n}`
    }
  ]);

  const handleStartSwarmExecution = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/ai/agent-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Coder',
          prompt: orchestratorPrompt,
          projectContext: projectTitle
        })
      });
      const data = await res.json();
      if (data.thought) {
        const newLog: AgentMessage = {
          id: 'log_' + Date.now(),
          agentRole: data.agentType || 'Coder',
          timestamp: new Date().toLocaleTimeString(),
          thought: data.thought,
          content: data.reviewNotes || 'Swarm execution complete',
          plan: data.plan,
          codeSnippet: data.codeSnippet
        };
        setExecutionLogs((prev) => [newLog, ...prev]);
      }
    } catch (e) {
      console.warn('Orchestrator AI fallback mode', e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/25">
            <Workflow className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Agent Orchestration Pipeline</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Phase 1 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              6-Agent Multi-Swarm • Dynamic Routing • Priority Queue • Shared Context Store • Execution Audit
            </p>
          </div>
        </div>

        <button
          onClick={handleStartSwarmExecution}
          disabled={isRunning}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {isRunning ? <Pause className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Swarm Executing...' : 'Run Swarm Execution Pipeline'}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/40">
        {[
          { id: 'pipeline', label: '1. Multi-Agent Pipeline', icon: <Bot className="w-4 h-4" /> },
          { id: 'routing', label: '2. Agent Router', icon: <Workflow className="w-4 h-4" /> },
          { id: 'queue', label: '3. Task Queue', icon: <Clock className="w-4 h-4" /> },
          { id: 'context', label: '4. Shared Context Store', icon: <Database className="w-4 h-4" /> },
          { id: 'history', label: '5. Execution Audit History', icon: <History className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Multi-Agent Pipeline Grid */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Global Swarm Execution Prompt
            </label>
            <input
              type="text"
              value={orchestratorPrompt}
              onChange={(e) => setOrchestratorPrompt(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((ag) => (
              <div key={ag.role} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${ag.color} text-slate-950 font-bold flex items-center justify-center text-xs shadow`}>
                      {ag.role.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{ag.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">{ag.role} Agent</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{ag.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Agent Router */}
      {activeTab === 'routing' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <h3 className="text-sm font-extrabold text-white">Automated Intent Classification & Agent Routing Table</h3>
          <div className="space-y-2">
            {[
              { pattern: 'Requirements / User Stories / Milestones', routedTo: 'Planner Agent' },
              { pattern: 'System Design / Drizzle Schema / Microservices', routedTo: 'Architect Agent' },
              { pattern: 'TypeScript Code Synthesis / Express Routes / Logic', routedTo: 'Coder Agent' },
              { pattern: 'Security Audit / Pen Testing / OWASP Scan', routedTo: 'Reviewer Agent' },
              { pattern: 'Vitest Unit Tests / Coverage Matrix / Assertions', routedTo: 'Tester Agent' },
              { pattern: 'Dockerfile / Cloud Run Deployment / CI CD', routedTo: 'DevOps Agent' },
            ].map((route, rIdx) => (
              <div key={rIdx} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300">Prompt Pattern: "{route.pattern}"</span>
                <span className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold font-mono">
                  → {route.routedTo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Task Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {executionQueue.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  item.status === 'completed' ? 'bg-emerald-400' : item.status === 'in_progress' ? 'bg-amber-400 animate-ping' : 'bg-slate-600'
                }`} />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                  <span className="text-[10px] font-mono text-slate-400">Assigned: {item.assignedAgent}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {item.priority}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : item.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Shared Context Store */}
      {activeTab === 'context' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <h3 className="text-sm font-extrabold text-white">Cross-Agent Memory & Context Sharing Buffer</h3>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <span className="text-amber-400 font-bold block">// Shared Memory State available to all agents</span>
            <pre className="text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
{JSON.stringify({
  activeProject: projectTitle,
  environment: 'Cloud Run Production',
  activeSchema: 'PostgreSQL + Drizzle',
  authMethod: 'JWT Bearer Token',
  lastAgentOutput: executionLogs[0]?.codeSnippet || '// Cached module output'
}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: Execution History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {executionLogs.map((log) => (
            <div key={log.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {log.agentRole}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">{log.timestamp}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Success
                </span>
              </div>

              {log.thought && (
                <p className="text-xs font-mono text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">Agent Thought Process:</span>
                  {log.thought}
                </p>
              )}

              {log.codeSnippet && (
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  {log.codeSnippet}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
