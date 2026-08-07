import React, { useState } from 'react';
import { 
  Bot, 
  Terminal, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Film, 
  BarChart3, 
  Code2, 
  Workflow, 
  Database,
  Play,
  ChevronDown,
  ChevronUp,
  Layers,
  Globe,
  Server,
  Lock,
  HelpCircle,
  Users,
  Star,
  ExternalLink,
  FileText,
  MessageSquare,
  Check,
  RefreshCw,
  SlidersHorizontal,
  BoxSelect
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { AGENTS } from '../../data/mockData';
import { AppMode, AgentRole } from '../../types';

interface ShowcaseViewProps {
  onLaunchIdeWithPrompt: (prompt: string, projectTitle: string) => void;
  onNavigateMode: (mode: AppMode) => void;
  theme?: 'dark' | 'light';
}

const PERFORMANCE_DATA = [
  { month: 'Jan', traditionalDays: 45, oproxHours: 4.2, debtScore: 68 },
  { month: 'Feb', traditionalDays: 42, oproxHours: 3.8, debtScore: 78 },
  { month: 'Mar', traditionalDays: 50, oproxHours: 3.1, debtScore: 86 },
  { month: 'Apr', traditionalDays: 48, oproxHours: 2.5, debtScore: 92 },
  { month: 'May', traditionalDays: 55, oproxHours: 1.9, debtScore: 96 },
  { month: 'Jun', traditionalDays: 60, oproxHours: 1.2, debtScore: 98 },
];

const PRESET_PROMPTS = [
  {
    title: 'Multi-Tenant Auth API',
    prompt: 'Build a high-performance REST API with JWT Auth, Rate Limiting middleware, and Postgres schema',
    icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    title: '4K AI Video Storyboard',
    prompt: 'Create an AI Video Storyboard generator for Media Studio with 4K asset rendering pipeline',
    icon: <Film className="w-3.5 h-3.5 text-pink-400" />
  },
  {
    title: 'Smart Tenant Lease Portal',
    prompt: 'Develop a smart tenant access portal with rent collection analytics and maintenance AI triage',
    icon: <Building2 className="w-3.5 h-3.5 text-cyan-400" />
  },
  {
    title: 'PostgreSQL ERD Engine',
    prompt: 'Design an enterprise multi-tenant PostgreSQL database schema with role-based access controls',
    icon: <Database className="w-3.5 h-3.5 text-amber-400" />
  }
];

const CUSTOMER_LOGOS = [
  { name: 'AETHEL CORP', tag: 'Enterprise AI' },
  { name: 'NEURALDYN', tag: 'Deep Learning' },
  { name: 'NEXUS AI', tag: 'Cloud Systems' },
  { name: 'QUANTUM GRID', tag: 'Infrastructure' },
  { name: 'SYNERGY MEDIA', tag: 'Creative Tech' },
  { name: 'APEX PROPTECH', tag: 'Real Estate OS' },
];

const TESTIMONIALS = [
  {
    quote: "OPROX cut our core microservice release cycle from 6 weeks down to 45 minutes. The 18-stage software factory guarantees zero breaking syntax regressions before deployment.",
    author: "Dr. Marcus Vance",
    role: "VP of Software Engineering",
    company: "Aethel Corp",
    avatar: "👨‍💻",
    rating: 5
  },
  {
    quote: "The multi-agent collaboration between Planner, Architect, and Reviewer feels like having a senior team working on AST synthesis around the clock.",
    author: "Elena Rostova",
    role: "Principal Cloud Architect",
    company: "NeuralDyn AI",
    avatar: "👩‍💻",
    rating: 5
  },
  {
    quote: "We launched our Media Studio creative pipeline and PropTech tenant portal on top of the OPROX Blank Mold in record time with perfect UI fidelity.",
    author: "Siddharth Mehta",
    role: "Chief Product Officer",
    company: "Nexus Media Systems",
    avatar: "🧑‍💻",
    rating: 5
  }
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Prompt Input & Intent Detection',
    agent: 'Planner Agent',
    desc: 'Translates high-level prompt requirements into structured specifications, data schemas, and UI layout trees.',
    badge: 'Spec Stage',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />
  },
  {
    step: '02',
    title: 'Architectural Blueprinting',
    agent: 'Architect Agent',
    desc: 'Designs state graphs, API route boundaries, and Virtual File System (VFS) node trees.',
    badge: 'Design Stage',
    icon: <Cpu className="w-4 h-4 text-indigo-400" />
  },
  {
    step: '03',
    title: 'AST Code Synthesis',
    agent: 'Coder Agent',
    desc: 'Synthesizes clean, type-safe TypeScript code with modular component separation and strict styling tokens.',
    badge: 'Synthesis Stage',
    icon: <Code2 className="w-4 h-4 text-cyan-400" />
  },
  {
    step: '04',
    title: 'Security Audit & Unit Verification',
    agent: 'Reviewer & Tester Agents',
    desc: 'Executes automated Vitest unit suites and checks code against enterprise OWASP security guidelines.',
    badge: 'Audit Stage',
    icon: <ShieldCheck className="w-4 h-4 text-amber-400" />
  },
  {
    step: '05',
    title: '18-Stage Factory Pipeline',
    agent: 'DevOps Agent',
    desc: 'Compiles, bundles with esbuild, and verifies zero syntax collisions on single-file CommonJS server output.',
    badge: 'Build Stage',
    icon: <Workflow className="w-4 h-4 text-pink-400" />
  },
  {
    step: '06',
    title: 'Cloud Run Production Release',
    agent: 'Release Manager',
    desc: 'Binds to port 3000 host 0.0.0.0 for live container execution with instant preview routing.',
    badge: 'Deploy Stage',
    icon: <Globe className="w-4 h-4 text-emerald-400" />
  }
];

const FAQS = [
  {
    q: "How does the 18-stage software factory guarantee build safety?",
    a: "Every change synthesized by the Coder Agent passes through AST compilation, Vitest verification, and esbuild bundling before reaching the live container preview. If an error occurs, the auto-remediation loop corrects the AST node immediately."
  },
  {
    q: "Does OPROX require external API keys or paid cloud subscriptions?",
    a: "No! OPROX is fully self-contained with zero required external API dependencies. All previews, database studio simulations, and agent telemetries run natively in the sandboxed runtime environment."
  },
  {
    q: "What is the 'Blank Mold' concept in OPROX Solutions?",
    a: "The 'Blank Mold' is an adaptable software architecture core. Rather than locking you into a static vertical template, OPROX adapts its state, storage, and visual components to become a Media Studio, a PropTech platform, an Enterprise OS, or an IDE on demand."
  },
  {
    q: "How does Database Studio interact with the Virtual File System?",
    a: "Database Studio parses Drizzle/Postgres schema files directly from the VFS tree, offering live ERD visualization, sample data generation, and SQL console testing without requiring external database servers."
  },
  {
    q: "Is OPROX responsive and compatible with both Light and Dark themes?",
    a: "Yes. The entire OPROX Design System (Phase 3 & Phase 4) uses tokenized color variables that instantly switch between high-contrast Light Mode and dark Google AI Studio-inspired workspace modes."
  }
];

export const ShowcaseView: React.FC<ShowcaseViewProps> = ({
  onLaunchIdeWithPrompt,
  onNavigateMode,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  
  // State for AI Prompt Box
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>('Planner');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const activeAgentInfo = AGENTS.find((a) => a.id === selectedAgent) || AGENTS[0];

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrompt = customPrompt.trim() || 'Build a full-stack autonomous application with REST API and DB schema';
    onLaunchIdeWithPrompt(finalPrompt, 'OPROX Custom Generation');
  };

  return (
    <div className={`space-y-16 pb-20 transition-colors duration-200 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* 1. HERO SECTION */}
      <section className={`relative overflow-hidden rounded-3xl border transition-all p-8 sm:p-14 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl'
      }`}>
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border ${
              isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>OPROX Autonomous Software Factory • Phase 4</span>
            </span>

            <span className={`text-[11px] font-mono px-3 py-1 rounded-full border ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              Google AI Studio Visual Spec
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
            OPROX: The Autonomous AI Software Engineering Platform
          </h1>

          <p className={`text-base sm:text-xl leading-relaxed max-w-3xl ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Turn natural language prompts into production-grade applications. Powered by a collaborative team of specialized AI agents, OPROX handles specification, architecture, code synthesis, security auditing, and live cloud container deployment.
          </p>

          {/* 2. INTERACTIVE AI PROMPT BOX */}
          <div className={`p-4 sm:p-6 rounded-2xl border space-y-4 shadow-2xl transition-all ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-300'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>Interactive AI Prompt Generator</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {customPrompt.length} / 500 chars
              </span>
            </div>

            <form onSubmit={handlePromptSubmit} className="space-y-3">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe your app concept (e.g., 'Build an enterprise multi-tenant analytics dashboard with JWT auth, Postgres ERD schema, and live telemetry monitors')..."
                rows={3}
                className={`w-full p-4 rounded-xl text-sm transition-all border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />

              {/* Quick suggestion pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
                {PRESET_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomPrompt(item.prompt)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/40">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Triggers 18-stage AST pipeline & 6 AI agent roles</span>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Generate in OPROX Code IDE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick Metrics Bar */}
          <div className={`pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <div>
              <p className="text-xs text-slate-400">Factory SLA Guarantee</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">99.98%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Automated Pipeline</p>
              <p className="text-2xl font-black text-indigo-400 mt-1">18 Stages</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Autonomous AI Team</p>
              <p className="text-2xl font-black text-cyan-400 mt-1">6 Agents</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Time-to-Market Gain</p>
              <p className="text-2xl font-black text-pink-400 mt-1">40x Faster</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CUSTOMER LOGOS (PLACEHOLDER) */}
      <section className="space-y-4">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          Trusted by Next-Generation Engineering Teams & Enterprises
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CUSTOMER_LOGOS.map((logo, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border text-center transition-all ${
                isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <p className="font-black text-xs tracking-wider">{logo.name}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{logo.tag}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WHAT IS OPROX (THE BLANK MOLD CONCEPT) */}
      <section className={`p-8 sm:p-12 rounded-3xl border space-y-8 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest font-mono">
            Core Philosophy
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            What is OPROX? The Adaptable "Blank Mold" Architecture
          </h2>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Traditional software engineering forces developers into static, rigid templates. OPROX introduces the "Blank Mold" concept—a high-performance, self-adapting software core that morphs into specialized vertical applications (IDE, Database Studio, Media Studio, PropTech OS) based on context and intent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
              01
            </div>
            <h3 className="font-bold text-base">Traditional Development</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manual boilerplate coding, fragmented tooling, slow 6-week sprint cycles, and fragile integration debt.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              02
            </div>
            <h3 className="font-bold text-base">Basic Code AI Assistants</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Isolated code completions that require constant manual copy-pasting and lack project-wide state context.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ring-2 ring-emerald-500/50 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              03
            </div>
            <h3 className="font-bold text-base text-emerald-400">OPROX Autonomous Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full-stack Virtual File System, 6 collaborative agent roles, 18-stage pipeline, and zero-downtime deployment.
            </p>
          </div>
        </div>
      </section>

      {/* 5. TWO CORE PILLARS */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest font-mono">
            System Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            The Two Core Pillars of OPROX
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Combining developer-centric software creation with industry-tailored vertical solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pillar 1: OPROX Code */}
          <div className={`p-8 rounded-3xl border space-y-6 flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Terminal className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Pillar 1
              </span>
              <h3 className="text-2xl font-bold">OPROX Code (Autonomous IDE)</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                A full-featured cloud IDE featuring Virtual File System, interactive bash terminal emulator, multi-agent dispatch panel, and instant Cloud Run preview routing.
              </p>

              <div className="space-y-2 pt-2">
                {[
                  '6 Specialized AI Agent Roles (Planner to DevOps)',
                  'Real-Time Virtual File System (VFS) Tree',
                  '18-Stage Software Factory Build Pipeline',
                  'Relational Database Studio with ERD Visualizer',
                  'One-Click Cloud Run & Docker Deployer'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigateMode('ide')}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch OPROX Code Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pillar 2: OPROX Solutions */}
          <div className={`p-8 rounded-3xl border space-y-6 flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                Pillar 2
              </span>
              <h3 className="text-2xl font-bold">OPROX Solutions (Vertical Hubs)</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Pre-configured domain hubs for specific industries. Launch specialized workspaces for media creative pipelines, smart real estate management, or enterprise knowledge OS.
              </p>

              <div className="space-y-2 pt-2">
                {[
                  'OPROX Media Studio (AI Scripting & 4K Asset Pipeline)',
                  'OPROX PropTech (Tenant Access & Yield Analytics)',
                  'OPROX Enterprise Memory OS (Corporate Rules Graph)',
                  'Modular Multi-Tenant Hub Architecture',
                  'Zero External API Dependency Guarantee'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onNavigateMode('media')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                }`}
              >
                Media Studio
              </button>
              <button
                onClick={() => onNavigateMode('proptech')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                }`}
              >
                PropTech Hub
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURES BENTO GRID */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-400" />
            <span>Platform Capabilities Grid</span>
          </h2>
          <p className="text-sm text-slate-400">
            6 high-density technical modules driving autonomous software synthesis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Bot className="w-8 h-8 text-emerald-400" />
            <h3 className="font-bold text-base">6 AI Agent Roles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Planner, Architect, Coder, Reviewer, Tester, and DevOps work in synchronization to craft full-stack code.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Workflow className="w-8 h-8 text-indigo-400" />
            <h3 className="font-bold text-base">18-Stage Software Factory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated compilation, AST validation, lint checks, and bundle generation with zero runtime breaking errors.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Code2 className="w-8 h-8 text-cyan-400" />
            <h3 className="font-bold text-base">Live Virtual File System</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect and edit files dynamically with active syntax highlight, line counts, and directory traversal.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Database className="w-8 h-8 text-amber-400" />
            <h3 className="font-bold text-base">Database Studio & ERD</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visual schema modeling, SQL query testing console, and sample record generation for PostgreSQL and SQLite.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Globe className="w-8 h-8 text-pink-400" />
            <h3 className="font-bold text-base">One-Click Cloud Deployment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deploy server containers instantly to Cloud Run with reverse proxy routing bound to port 3000.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Cpu className="w-8 h-8 text-teal-400" />
            <h3 className="font-bold text-base">Enterprise Rules Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Self-improving corporate rules memory graph enforcing organizational SLAs and security guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* 7. AI WORKFLOW TIMELINE */}
      <section className={`p-8 sm:p-12 rounded-3xl border space-y-8 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest font-mono">
              Interactive Execution Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              AI Workflow Timeline (6 Core Stages)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Click any step to inspect agent duties
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {WORKFLOW_STEPS.map((s, idx) => {
            const isActive = activeWorkflowStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-mono text-emerald-400">{s.step}</span>
                  {s.icon}
                </div>
                <h3 className="font-bold text-xs">{s.title}</h3>
                <span className="text-[10px] font-semibold text-slate-400 block mt-1">{s.agent}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Workflow Inspector Box */}
        <div className={`p-6 rounded-2xl border space-y-3 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {WORKFLOW_STEPS[activeWorkflowStep].badge}
            </span>
            <h3 className="font-bold text-sm">{WORKFLOW_STEPS[activeWorkflowStep].title}</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {WORKFLOW_STEPS[activeWorkflowStep].desc}
          </p>
        </div>
      </section>

      {/* 8. TESTIMONIALS (PLACEHOLDER) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Engineering Leadership Testimonials</span>
          </h2>
          <p className="text-sm text-slate-400">
            What Tech Leads and Principal Architects say about OPROX.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border space-y-4 flex flex-col justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/40">
                <div className="text-2xl">{t.avatar}</div>
                <div>
                  <p className="font-bold text-xs">{t.author}</p>
                  <p className="text-[10px] text-slate-400">{t.role} • {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. PRICING PREVIEW */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest font-mono">
            Flexible Plans
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            OPROX Tier Preview
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Transparent pricing scaled for solo developers, fast-growing teams, and enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Developer Tier */}
          <div className={`p-8 rounded-3xl border space-y-6 flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow'
          }`}>
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">Developer Tier</span>
              <div>
                <p className="text-3xl font-black">$0 <span className="text-xs font-normal text-slate-400">/ forever</span></p>
                <p className="text-xs text-slate-400 mt-1">Ideal for exploration and client-side prototyping</p>
              </div>
              <div className="space-y-2 pt-2 text-xs">
                <p className="flex items-center gap-2">✓ 6 AI Agent Roles</p>
                <p className="flex items-center gap-2">✓ Local Virtual File System</p>
                <p className="flex items-center gap-2">✓ Standard 18-Stage Pipeline</p>
                <p className="flex items-center gap-2">✓ Mock Data Engine</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateMode('ide')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
            >
              Start Free Developer Mode
            </button>
          </div>

          {/* Pro / Team Tier */}
          <div className={`p-8 rounded-3xl border space-y-6 flex flex-col justify-between ring-2 ring-emerald-500 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono">Pro / Team Tier</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Popular</span>
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400">$49 <span className="text-xs font-normal text-slate-400">/ user / mo</span></p>
                <p className="text-xs text-slate-400 mt-1">For professional software teams & production systems</p>
              </div>
              <div className="space-y-2 pt-2 text-xs">
                <p className="flex items-center gap-2">✓ Everything in Developer</p>
                <p className="flex items-center gap-2">✓ Live Cloud Run Deployment</p>
                <p className="flex items-center gap-2">✓ Database Studio & ERD Engine</p>
                <p className="flex items-center gap-2">✓ Priority Agent AST Queue</p>
                <p className="flex items-center gap-2">✓ Media Studio 4K Pipelines</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateMode('ide')}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-emerald-500/20"
            >
              Launch Pro Workspace
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className={`p-8 rounded-3xl border space-y-6 flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow'
          }`}>
            <div className="space-y-4">
              <span className="text-xs font-bold text-indigo-400 uppercase font-mono">Enterprise Tier</span>
              <div>
                <p className="text-3xl font-black text-indigo-400">Custom <span className="text-xs font-normal text-slate-400">/ annual</span></p>
                <p className="text-xs text-slate-400 mt-1">Dedicated cloud infrastructure & custom memory rules</p>
              </div>
              <div className="space-y-2 pt-2 text-xs">
                <p className="flex items-center gap-2">✓ Dedicated Cloud Run Clusters</p>
                <p className="flex items-center gap-2">✓ Enterprise Memory OS & Rules</p>
                <p className="flex items-center gap-2">✓ 99.99% SLA Guarantee</p>
                <p className="flex items-center gap-2">✓ Dedicated Technical Account Mgr</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateMode('enterprise')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
            >
              Explore Enterprise OS
            </button>
          </div>
        </div>
      </section>

      {/* 10. FAQ PREVIEW */}
      <section className={`p-8 sm:p-12 rounded-3xl border space-y-6 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest font-mono">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer font-bold text-xs sm:text-sm"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className={`pt-12 pb-6 border-t space-y-8 ${
        isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold text-xs">
                OP
              </div>
              <span className="font-extrabold text-base tracking-wider text-slate-100">OPROX</span>
            </div>
            <p className="text-xs leading-relaxed">
              Autonomous AI Software Engineering Platform. Transforming natural language prompts into production cloud applications.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Factory Live • All Systems Nominal</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold uppercase tracking-wider text-slate-200">Core OS</p>
            <p onClick={() => onNavigateMode('ide')} className="hover:text-emerald-400 cursor-pointer">OPROX Code IDE</p>
            <p onClick={() => onNavigateMode('database')} className="hover:text-emerald-400 cursor-pointer">Database Studio</p>
            <p onClick={() => onNavigateMode('cloud')} className="hover:text-emerald-400 cursor-pointer">Cloud Monitored Deploy</p>
            <p onClick={() => onNavigateMode('design-system')} className="hover:text-emerald-400 cursor-pointer">Design System System Specs</p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold uppercase tracking-wider text-slate-200">Industry Solutions</p>
            <p onClick={() => onNavigateMode('media')} className="hover:text-emerald-400 cursor-pointer">OPROX Media Studio</p>
            <p onClick={() => onNavigateMode('proptech')} className="hover:text-emerald-400 cursor-pointer">OPROX PropTech Platform</p>
            <p onClick={() => onNavigateMode('enterprise')} className="hover:text-emerald-400 cursor-pointer">Enterprise Memory OS</p>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold uppercase tracking-wider text-slate-200">Legal & Specs</p>
            <p className="hover:text-emerald-400 cursor-pointer">Phase 4 Rebuild Docs</p>
            <p className="hover:text-emerald-400 cursor-pointer">Google AI Studio Inspiration</p>
            <p className="hover:text-emerald-400 cursor-pointer">Privacy & Local Storage Rules</p>
            <p className="hover:text-emerald-400 cursor-pointer">Terms of Autonomous Service</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-800/40 text-[11px] font-mono">
          <p>© 2026 OPROX Inc. All rights reserved. Zero External API Dependencies.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Twitter / X</span>
            <span className="hover:text-white cursor-pointer">GitHub</span>
            <span className="hover:text-white cursor-pointer">Discord Community</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
