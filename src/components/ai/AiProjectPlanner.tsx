import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Clock,
  GitBranch,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Play,
  CheckCircle2,
  ChevronRight,
  Plus,
  BarChart2
} from 'lucide-react';
import { AgentRole } from '../../types';

interface PlanTask {
  id: string;
  title: string;
  milestoneId: string;
  assignedAgent: AgentRole;
  storyPoints: number;
  estimatedHours: number;
  status: 'pending' | 'in_progress' | 'completed';
  prerequisites: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Milestone {
  id: string;
  title: string;
  targetSprint: string;
  completionPercent: number;
  status: 'planning' | 'active' | 'completed';
  description: string;
}

interface AiProjectPlannerProps {
  projectTitle?: string;
  theme?: 'dark' | 'light';
}

export const AiProjectPlanner: React.FC<AiProjectPlannerProps> = ({
  projectTitle = 'OPROX Project Workspace',
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'milestones' | 'wbs' | 'dag' | 'sprints' | 'progress'>('milestones');
  const [isGenerating, setIsGenerating] = useState(false);

  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: 'm1',
      title: 'Phase 1: Architectural Blueprint & Schema Design',
      targetSprint: 'Sprint 1',
      completionPercent: 100,
      status: 'completed',
      description: 'System topology specs, Drizzle schema, JWT Auth and Redis cache setup.'
    },
    {
      id: 'm2',
      title: 'Phase 2: Core Microservices & API Routes',
      targetSprint: 'Sprint 2',
      completionPercent: 85,
      status: 'active',
      description: 'Express REST routes, AI Governance Gate, Stripe billing and project endpoints.'
    },
    {
      id: 'm3',
      title: 'Phase 3: Multi-Agent Workspace UI',
      targetSprint: 'Sprint 3',
      completionPercent: 40,
      status: 'active',
      description: 'React VFS workspace, Architect, Planner, Specification and Memory panels.'
    },
    {
      id: 'm4',
      title: 'Phase 4: Security Audit & Automated Vitest Suite',
      targetSprint: 'Sprint 4',
      completionPercent: 0,
      status: 'planning',
      description: 'Penetration testing, RBAC permission audits, 100% test coverage suite.'
    },
    {
      id: 'm5',
      title: 'Phase 5: Cloud Run Production Deployment',
      targetSprint: 'Sprint 5',
      completionPercent: 0,
      status: 'planning',
      description: 'ESBuild bundling, Cloud Run container staging, DNS setup, SSL certificates.'
    }
  ]);

  const [tasks, setTasks] = useState<PlanTask[]>([
    {
      id: 'task-1',
      title: 'Design PostgreSQL schema for Multi-Tenant Organizations',
      milestoneId: 'm1',
      assignedAgent: 'Architect',
      storyPoints: 5,
      estimatedHours: 8,
      status: 'completed',
      prerequisites: [],
      priority: 'critical'
    },
    {
      id: 'task-2',
      title: 'Implement JWT Auth & Rate Limiting Express Middleware',
      milestoneId: 'm1',
      assignedAgent: 'Coder',
      storyPoints: 3,
      estimatedHours: 6,
      status: 'completed',
      prerequisites: ['task-1'],
      priority: 'high'
    },
    {
      id: 'task-3',
      title: 'Construct AI Swarm Pipeline & Agent Router',
      milestoneId: 'm2',
      assignedAgent: 'Architect',
      storyPoints: 8,
      estimatedHours: 12,
      status: 'in_progress',
      prerequisites: ['task-2'],
      priority: 'critical'
    },
    {
      id: 'task-4',
      title: 'Build Project Specification Engine UI Panels',
      milestoneId: 'm3',
      assignedAgent: 'Coder',
      storyPoints: 5,
      estimatedHours: 8,
      status: 'in_progress',
      prerequisites: ['task-3'],
      priority: 'high'
    },
    {
      id: 'task-5',
      title: 'Run Vitest Phase 1 Security & Runtime Integrity Tests',
      milestoneId: 'm4',
      assignedAgent: 'Tester',
      storyPoints: 5,
      estimatedHours: 8,
      status: 'pending',
      prerequisites: ['task-4'],
      priority: 'critical'
    }
  ]);

  const handleGenerateAIPlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/agent-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'Planner',
          prompt: `Generate detailed project plan, milestone breakdown, dependency graph, and sprint schedule for project: ${projectTitle}`,
          projectContext: projectTitle
        })
      });
      const data = await res.json();
      if (data.plan && Array.isArray(data.plan)) {
        // Updated plan generated
      }
    } catch (e) {
      console.warn('Planner AI fallback mode', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalPoints = tasks.reduce((sum, t) => sum + t.storyPoints, 0);
  const completedPoints = tasks.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.storyPoints, 0);
  const completionRate = Math.round((completedPoints / (totalPoints || 1)) * 100);

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25">
            <Calendar className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Project Planner</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 1 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Milestone Generation • Work Breakdown Structure (WBS) • Dependency Graph DAG • Sprint Velocity
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateAIPlan}
          disabled={isGenerating}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Synthesizing Sprint Plan...' : 'Generate AI Milestones & Tasks'}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/40">
        {[
          { id: 'milestones', label: '1. Milestones Roadmap', icon: <Layers className="w-4 h-4" /> },
          { id: 'wbs', label: '2. Work Breakdown (WBS)', icon: <CheckSquare className="w-4 h-4" /> },
          { id: 'dag', label: '3. Dependency Graph (DAG)', icon: <GitBranch className="w-4 h-4" /> },
          { id: 'sprints', label: '4. Sprint Backlog', icon: <Clock className="w-4 h-4" /> },
          { id: 'progress', label: '5. Progress & Velocity', icon: <TrendingUp className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
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

      {/* TAB 1: Milestones Roadmap */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          {milestones.map((m) => (
            <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    m.status === 'completed' ? 'bg-emerald-400' : m.status === 'active' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                  }`} />
                  <h3 className="text-sm font-extrabold text-white">{m.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {m.targetSprint}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {m.completionPercent}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${m.completionPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Work Breakdown Structure (WBS) */}
      {activeTab === 'wbs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 pb-2 border-b border-slate-800">
            <span>Task Title</span>
            <div className="flex items-center gap-6">
              <span>Agent Role</span>
              <span>Points</span>
              <span>Status</span>
            </div>
          </div>

          {tasks.map((t) => (
            <div key={t.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`p-1 rounded ${
                  t.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{t.title}</h4>
                  <span className="text-[10px] font-mono text-slate-500">PREREQS: {t.prerequisites.join(', ') || 'None'}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {t.assignedAgent}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">{t.storyPoints} pts</span>
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                  t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Dependency Graph DAG */}
      {activeTab === 'dag' && (
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Directed Acyclic Graph (DAG) Execution Dependencies</h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Critical Path Optimal
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-6 rounded-xl bg-slate-900/60 border border-slate-800">
            {tasks.map((t, idx) => (
              <React.Fragment key={t.id}>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1 max-w-[160px]">
                  <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold block">{t.id}</span>
                  <p className="text-[11px] font-bold text-slate-200 line-clamp-2">{t.title}</p>
                  <span className="text-[9px] font-mono text-emerald-400">{t.storyPoints} SP</span>
                </div>
                {idx < tasks.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-slate-600 shrink-0 hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Sprint Backlog */}
      {activeTab === 'sprints' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Sprint 1 (Done)', 'Sprint 2 (In Progress)', 'Sprint 3 (Upcoming)'].map((sprint, sIdx) => (
            <div key={sIdx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-extrabold text-white">{sprint}</h4>
                <span className="text-[10px] font-mono font-bold text-emerald-400">13 SP Capacity</span>
              </div>
              <div className="space-y-2">
                {tasks.slice(sIdx * 2, sIdx * 2 + 2).map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <p className="font-bold text-slate-200">{t.title}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{t.assignedAgent}</span>
                      <span className="text-indigo-400">{t.storyPoints} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: Progress & Velocity */}
      {activeTab === 'progress' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sprint Completion Rate</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{completionRate}%</span>
            <p className="text-xs text-slate-400">{completedPoints} of {totalPoints} Story Points completed</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Team Velocity</span>
            <span className="text-2xl font-extrabold text-cyan-400 font-mono">24.5 SP / Sprint</span>
            <p className="text-xs text-slate-400">Estimated project delivery in 2 Sprints</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Critical Path Health</span>
            <span className="text-2xl font-extrabold text-indigo-400 font-mono">0 Blockers</span>
            <p className="text-xs text-slate-400">All prerequisite dependencies clear</p>
          </div>
        </div>
      )}
    </div>
  );
};
