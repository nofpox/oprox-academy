import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  Workflow,
  BookOpen,
  Brain,
  Zap,
  ShieldCheck,
  Code2,
  FileDiff,
  Network,
  ShieldAlert,
  Cpu,
  FileText,
  Sparkles,
  Layers,
  FolderPlus,
  Users,
  RefreshCw,
  Rocket,
  GitMerge
} from 'lucide-react';
// Phase 1 Components
import { AiSoftwareArchitect } from './AiSoftwareArchitect';
import { AiProjectPlanner } from './AiProjectPlanner';
import { AiAgentOrchestrator } from './AiAgentOrchestrator';
import { ProjectSpecEngine } from './ProjectSpecEngine';
import { AiConversationMemory } from './AiConversationMemory';

// Phase 2 Components
import { AutonomousCodeGenerator } from './AutonomousCodeGenerator';
import { IntelligentPatchEngine } from './IntelligentPatchEngine';
import { WorkspaceCodeIntelligence } from './WorkspaceCodeIntelligence';
import { AiCodeReviewer } from './AiCodeReviewer';
import { AiTestGenerator } from './AiTestGenerator';
import { AiDocGenerator } from './AiDocGenerator';

// Phase 3 Components
import { AiProjectGenerator } from './AiProjectGenerator';
import { MultiAgentCollaboration } from './MultiAgentCollaboration';
import { TaskExecutionPipeline } from './TaskExecutionPipeline';
import { LiveWorkspaceSync } from './LiveWorkspaceSync';
import { AiReleaseManager } from './AiReleaseManager';
import { EndToEndLifecycleEngine } from './EndToEndLifecycleEngine';

// Phase 4 Components
import { ProductionDeliveryEngine } from './ProductionDeliveryEngine';

// Phase 5 Components
import { EnterpriseCollaborationEngine } from './EnterpriseCollaborationEngine';

// Phase 6 Components
import { Phase6ProductionEngine } from './Phase6ProductionEngine';

interface OproxCodeAiSuiteProps {
  theme?: 'dark' | 'light';
  activeProjectTitle?: string;
  onApplyCodeToVfs?: (code: string) => void;
  onApplySpecToVfs?: (filename: string, content: string) => void;
}

export const OproxCodeAiSuite: React.FC<OproxCodeAiSuiteProps> = ({
  theme = 'dark',
  activeProjectTitle = 'OPROX Autonomous System',
  onApplyCodeToVfs,
  onApplySpecToVfs
}) => {
  const isDark = theme === 'dark';

  const [activePhase, setActivePhase] = useState<'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'phase6'>('phase6');
  const [activeModule, setActiveModule] = useState<string>('production_delivery');

  const phase1Modules = [
    {
      id: 'architect',
      name: 'AI Software Architect',
      icon: <Compass className="w-4 h-4" />,
      badge: 'Topology & DB',
      desc: 'Requirement analysis, system architecture, module breakdown, tech stack, and DB schemas.'
    },
    {
      id: 'planner',
      name: 'AI Project Planner',
      icon: <Calendar className="w-4 h-4" />,
      badge: 'Sprint WBS',
      desc: 'Milestones generation, work breakdown structure (WBS), dependency DAG graph, and velocity.'
    },
    {
      id: 'orchestration',
      name: 'Agent Orchestration',
      icon: <Workflow className="w-4 h-4" />,
      badge: 'Swarm Execution',
      desc: '6-agent execution pipeline, automated prompt routing, task queue, and audit history.'
    },
    {
      id: 'spec_engine',
      name: 'Specification Engine',
      icon: <BookOpen className="w-4 h-4" />,
      badge: '5 Spec Suite',
      desc: 'One-click PRD, Technical Spec, Database Spec, OpenAPI 3.0, and Architecture Spec.'
    },
    {
      id: 'memory',
      name: 'Conversation Memory',
      icon: <Brain className="w-4 h-4" />,
      badge: 'ADR & Context',
      desc: 'Persistent project context, architectural decision records (ADR), and session snapshots.'
    },
  ];

  const phase2Modules = [
    {
      id: 'codegen',
      name: 'Code Generation',
      icon: <Code2 className="w-4 h-4" />,
      badge: 'Workspace Aware',
      desc: 'Autonomous code generator for complete projects, modules, APIs, DB models, and components.'
    },
    {
      id: 'patch',
      name: 'Patch Engine',
      icon: <FileDiff className="w-4 h-4" />,
      badge: 'Safe Diff Engine',
      desc: 'Safe file patch editor, side-by-side diff previews, pre-patch validation, and instant rollback.'
    },
    {
      id: 'intelligence',
      name: 'Code Intelligence',
      icon: <Network className="w-4 h-4" />,
      badge: 'Symbol Graph',
      desc: 'Workspace symbol indexer, dependency graph, cross-references, and rename refactoring.'
    },
    {
      id: 'review',
      name: 'AI Code Review',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: 'OWASP & Quality',
      desc: 'Automated 8-dimensional code review, security OWASP audit, and quality score rating.'
    },
    {
      id: 'test',
      name: 'AI Test Generator',
      icon: <Cpu className="w-4 h-4" />,
      badge: 'Vitest Runner',
      desc: 'Vitest unit, REST API, integration, and edge-case test suite synthesis with coverage report.'
    },
    {
      id: 'doc',
      name: 'Doc Generator',
      icon: <FileText className="w-4 h-4" />,
      badge: 'Markdown Suite',
      desc: 'One-click technical documentation generation for README, API, Architecture, and Changelogs.'
    },
  ];

  const phase3Modules = [
    {
      id: 'lifecycle',
      name: 'End-to-End Lifecycle',
      icon: <Sparkles className="w-4 h-4" />,
      badge: '14 Stages',
      desc: 'Unified lifecycle workflow from idea to requirements, planning, code, test, security, and cloud release.'
    },
    {
      id: 'generator',
      name: 'AI Project Generator',
      icon: <FolderPlus className="w-4 h-4" />,
      badge: 'Scaffold Wizard',
      desc: '6-step new project wizard with template, architecture, stack, database, and auth selection.'
    },
    {
      id: 'collaboration',
      name: '9-Agent Swarm',
      icon: <Users className="w-4 h-4" />,
      badge: 'Multi-Agent',
      desc: '9 specialist agents with shared context bus, agent-to-agent handoffs, and dependency DAG.'
    },
    {
      id: 'pipeline',
      name: 'Task Pipeline',
      icon: <Workflow className="w-4 h-4" />,
      badge: 'DAG Execution',
      desc: 'Task execution queue, parallel task execution, retry handling, failure recovery, and status persistence.'
    },
    {
      id: 'sync',
      name: 'Workspace Sync',
      icon: <RefreshCw className="w-4 h-4" />,
      badge: 'Real-Time VFS',
      desc: 'Live workspace monitoring for VFS state, build status, Vitest coverage, Git branch, and Cloud Run.'
    },
    {
      id: 'release',
      name: 'Release Manager',
      icon: <Rocket className="w-4 h-4" />,
      badge: 'SemVer & Deploy',
      desc: 'Release candidate creation, semantic versioning, release notes synthesis, and production readiness.'
    },
  ];

  const phase4Modules = [
    {
      id: 'delivery',
      name: 'Delivery & Operations',
      icon: <Rocket className="w-4 h-4" />,
      badge: 'Phase 4 Live',
      desc: 'Deployment orchestration, release gate, migration safety, health inspection, incident & rollback.'
    },
  ];

  const phase5Modules = [
    {
      id: 'enterprise',
      name: 'Enterprise Governance',
      icon: <Users className="w-4 h-4" />,
      badge: 'Phase 5 Live',
      desc: 'Enterprise collaboration, CR engine, human approvals, segregation of duties, and AI autonomy limits.'
    },
  ];

  const phase6Modules = [
    {
      id: 'production_delivery',
      name: 'Production Delivery Suite',
      icon: <GitMerge className="w-4 h-4" />,
      badge: 'Phase 6 Live',
      desc: 'Repository provider adapters, Git branch management, CI/CD orchestration, preview environments & governed delivery.'
    },
  ];

  const currentModules =
    activePhase === 'phase6'
      ? phase6Modules
      : activePhase === 'phase5'
      ? phase5Modules
      : activePhase === 'phase4'
      ? phase4Modules
      : activePhase === 'phase3'
      ? phase3Modules
      : activePhase === 'phase2'
      ? phase2Modules
      : phase1Modules;

  return (
    <div className={`min-h-screen p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Banner & Phase Switcher */}
      <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20">
              <Zap className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight">OPROX Code / AI</h1>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500 text-slate-950 shadow-md">
                  Phase 3 Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Autonomous AI Software Engineering Environment • Active Project: <strong className="text-emerald-400 font-mono">{activeProjectTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Phase Selector Toggle */}
            <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => {
                  setActivePhase('phase1');
                  setActiveModule('architect');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activePhase === 'phase1'
                    ? 'bg-indigo-500 text-slate-950 shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phase 1: Planning
              </button>
              <button
                onClick={() => {
                  setActivePhase('phase2');
                  setActiveModule('codegen');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activePhase === 'phase2'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phase 2: Execution Engine
              </button>
              <button
                onClick={() => {
                  setActivePhase('phase3');
                  setActiveModule('lifecycle');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activePhase === 'phase3'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phase 3: Lifecycle
              </button>
              <button
                onClick={() => {
                  setActivePhase('phase4');
                  setActiveModule('delivery');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activePhase === 'phase4'
                    ? 'bg-teal-400 text-slate-950 shadow-lg shadow-teal-400/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phase 4: Operations
              </button>
              <button
                onClick={() => {
                  setActivePhase('phase5');
                  setActiveModule('enterprise');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activePhase === 'phase5'
                    ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phase 5: Enterprise
              </button>
              <button
                onClick={() => {
                  setActivePhase('phase6');
                  setActiveModule('production_delivery');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activePhase === 'phase6'
                    ? 'bg-indigo-400 text-slate-950 shadow-lg shadow-indigo-400/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phase 6: Production Delivery
              </button>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 hidden sm:flex">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">AI Governance Gate</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">100% Protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-6">
          {currentModules.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                  isActive
                    ? activePhase === 'phase3'
                      ? 'bg-gradient-to-br from-emerald-600/30 via-slate-900 to-slate-950 border-emerald-500 shadow-xl shadow-emerald-500/10'
                      : activePhase === 'phase2'
                      ? 'bg-gradient-to-br from-cyan-600/30 via-slate-900 to-slate-950 border-cyan-500 shadow-xl shadow-cyan-500/10'
                      : 'bg-gradient-to-br from-indigo-600/30 via-slate-900 to-slate-950 border-indigo-500 shadow-xl shadow-indigo-500/10'
                    : isDark
                    ? 'bg-slate-950/60 hover:bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${
                    isActive
                      ? activePhase === 'phase3' ? 'bg-emerald-500 text-slate-950' : activePhase === 'phase2' ? 'bg-cyan-500 text-slate-950' : 'bg-indigo-500 text-white'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-white'
                  }`}>
                    {mod.icon}
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {mod.badge}
                  </span>
                </div>
                <h3 className={`text-xs font-extrabold transition-colors ${isActive ? 'text-white' : ''}`}>
                  {mod.name}
                </h3>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {mod.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Module View Body */}
      <div>
        {/* Phase 1 Modules */}
        {activeModule === 'architect' && (
          <AiSoftwareArchitect
            projectTitle={activeProjectTitle}
            theme={theme}
            onApplyArchitectureToVfs={onApplyCodeToVfs}
          />
        )}

        {activeModule === 'planner' && (
          <AiProjectPlanner
            projectTitle={activeProjectTitle}
            theme={theme}
          />
        )}

        {activeModule === 'orchestration' && (
          <AiAgentOrchestrator
            projectTitle={activeProjectTitle}
            theme={theme}
          />
        )}

        {activeModule === 'spec_engine' && (
          <ProjectSpecEngine
            projectTitle={activeProjectTitle}
            theme={theme}
            onApplySpecToVfs={onApplySpecToVfs}
          />
        )}

        {activeModule === 'memory' && (
          <AiConversationMemory
            projectTitle={activeProjectTitle}
            theme={theme}
          />
        )}

        {/* Phase 2 Modules */}
        {activeModule === 'codegen' && (
          <AutonomousCodeGenerator
            projectTitle={activeProjectTitle}
            theme={theme}
            onApplyToVfs={(files) => {
              if (onApplyCodeToVfs && files.length > 0) {
                onApplyCodeToVfs(files[0].content);
              }
            }}
          />
        )}

        {activeModule === 'patch' && (
          <IntelligentPatchEngine
            theme={theme}
            onApplyPatch={(patch) => {
              if (onApplyCodeToVfs) onApplyCodeToVfs(patch.patchedContent);
            }}
          />
        )}

        {activeModule === 'intelligence' && (
          <WorkspaceCodeIntelligence
            theme={theme}
          />
        )}

        {activeModule === 'review' && (
          <AiCodeReviewer
            theme={theme}
          />
        )}

        {activeModule === 'test' && (
          <AiTestGenerator
            theme={theme}
          />
        )}

        {activeModule === 'doc' && (
          <AiDocGenerator
            theme={theme}
            onSaveDocToVfs={(doc) => {
              if (onApplySpecToVfs) onApplySpecToVfs(doc.targetPath, doc.markdownContent);
            }}
          />
        )}

        {/* Phase 3 Modules */}
        {activeModule === 'lifecycle' && (
          <EndToEndLifecycleEngine
            projectTitle={activeProjectTitle}
            theme={theme}
            onNavigateModule={(modId) => setActiveModule(modId)}
          />
        )}

        {activeModule === 'generator' && (
          <AiProjectGenerator
            theme={theme}
            onProjectGenerated={(cfg) => {
              if (onApplySpecToVfs) onApplySpecToVfs('src/config/project.json', JSON.stringify(cfg, null, 2));
            }}
          />
        )}

        {activeModule === 'collaboration' && (
          <MultiAgentCollaboration
            projectTitle={activeProjectTitle}
            theme={theme}
          />
        )}

        {activeModule === 'pipeline' && (
          <TaskExecutionPipeline
            projectTitle={activeProjectTitle}
            theme={theme}
          />
        )}

        {activeModule === 'sync' && (
          <LiveWorkspaceSync
            theme={theme}
          />
        )}

        {activeModule === 'release' && (
          <AiReleaseManager
            theme={theme}
          />
        )}

        {/* Phase 4 Modules */}
        {activeModule === 'delivery' && (
          <ProductionDeliveryEngine
            projectTitle={activeProjectTitle}
            theme={theme}
          />
        )}

        {/* Phase 5 Modules */}
        {activeModule === 'enterprise' && (
          <EnterpriseCollaborationEngine
            projectTitle={activeProjectTitle}
            theme={theme}
          />
        )}

        {/* Phase 6 Modules */}
        {activeModule === 'production_delivery' && (
          <Phase6ProductionEngine />
        )}
      </div>
    </div>
  );
};
