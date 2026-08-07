import React, { useState } from 'react';
import {
  LayoutDashboard,
  Zap,
  Bot,
  Terminal,
  Database,
  Cloud,
  Film,
  Building2,
  Cpu,
  Plus,
  Play,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Folder,
  FileCode,
  HardDrive,
  Users,
  Bell,
  Star,
  Bookmark,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Layers,
  Code2,
  BarChart3,
  Globe,
  Lock,
  X,
  Command,
  Move,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { AppMode, AgentRole } from '../../types';
import { AGENTS } from '../../data/mockData';

const RECENT_PROJECTS = [
  {
    id: '1',
    title: 'Aethel Multi-Tenant Auth API',
    description: 'High-performance REST API with JWT Auth, Rate Limiting middleware, and Postgres schema',
    category: 'Backend REST',
    updatedAt: '10 mins ago',
    icon: '🔐'
  },
  {
    id: '2',
    title: 'PropTech Lease & Rent Portal',
    description: 'Smart tenant access portal with rent collection analytics and maintenance AI triage',
    category: 'PropTech OS',
    updatedAt: '2 hours ago',
    icon: '🏢'
  },
  {
    id: '3',
    title: 'Media Studio 4K Storyboard Generator',
    description: 'AI Video Storyboard generator for Media Studio with 4K asset rendering pipeline',
    category: 'Media AI',
    updatedAt: '1 day ago',
    icon: '🎬'
  },
  {
    id: '4',
    title: 'PostgreSQL Multi-Tenant ERD Engine',
    description: 'Enterprise multi-tenant PostgreSQL database schema with role-based access controls',
    category: 'Database DB',
    updatedAt: '3 days ago',
    icon: '🗄️'
  }
];

interface DashboardViewProps {
  onNavigateMode: (mode: AppMode) => void;
  onLaunchIdeWithPrompt: (prompt: string, projectTitle: string) => void;
  theme?: 'dark' | 'light';
}

const USAGE_CHART_DATA = [
  { time: '00:00', tokens: 1200, astRuns: 14, cpu: 22 },
  { time: '04:00', tokens: 800, astRuns: 8, cpu: 15 },
  { time: '08:00', tokens: 3400, astRuns: 42, cpu: 65 },
  { time: '12:00', tokens: 5100, astRuns: 68, cpu: 84 },
  { time: '16:00', tokens: 4200, astRuns: 55, cpu: 72 },
  { time: '20:00', tokens: 2900, astRuns: 36, cpu: 48 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateMode,
  onLaunchIdeWithPrompt,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // Section visibility / reorder state
  const [activeSectionFilter, setActiveSectionFilter] = useState<'all' | 'projects' | 'agents' | 'activity'>('all');
  const [favoriteProjects, setFavoriteProjects] = useState<string[]>(['1', '2']);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFavorite = (id: string) => {
    setFavoriteProjects((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const dismissNotification = (id: string) => {
    setDismissedNotificationIds((prev) => [...prev, id]);
  };

  const initialNotifications = [
    { id: 'n1', title: '18-Stage Build Passed', desc: 'OPROX Factory compiled esbuild target server.cjs with 0 warnings.', time: '2m ago', type: 'success' },
    { id: 'n2', title: 'Cloud Run Container Active', desc: 'Service listening on port 3000 (0.0.0.0) with 14ms latency.', time: '12m ago', type: 'info' },
    { id: 'n3', title: 'Security Audit Cleared', desc: 'Reviewer Agent verified 0 high-severity OWASP vulnerabilities.', time: '45m ago', type: 'security' }
  ];

  const filteredNotifications = initialNotifications.filter((n) => !dismissedNotificationIds.includes(n.id));

  const recentFiles = [
    { name: 'server.ts', path: '/src/server.ts', size: '2.4 KB', updated: '3 mins ago', type: 'ts' },
    { name: 'schema.ts', path: '/src/db/schema.ts', size: '1.8 KB', updated: '12 mins ago', type: 'db' },
    { name: 'aiAgentService.ts', path: '/src/services/aiAgentService.ts', size: '5.1 KB', updated: '25 mins ago', type: 'ts' },
    { name: 'App.tsx', path: '/src/App.tsx', size: '3.2 KB', updated: '1 hour ago', type: 'tsx' },
    { name: 'metadata.json', path: '/metadata.json', size: '0.4 KB', updated: '2 hours ago', type: 'json' },
  ];

  const templatesList = [
    { id: 'blank', name: 'Blank Mold Adaptive Core', desc: 'Pure adaptive foundation with VFS, agent triggers, and dev proxy.', icon: <Sparkles className="w-5 h-5 text-emerald-400" />, prompt: 'Initialize OPROX Blank Mold Core with full VFS support' },
    { id: 'auth-api', name: 'Full-Stack Auth & REST API', desc: 'Express Node ESM server with JWT tokens, rate limiter, and Postgres.', icon: <Terminal className="w-5 h-5 text-cyan-400" />, prompt: 'Build Express REST API with JWT Auth and Postgres Schema' },
    { id: 'proptech', name: 'PropTech Lease Engine', desc: 'Tenant management portal, rent analytics, and maintenance AI triage.', icon: <Building2 className="w-5 h-5 text-indigo-400" />, prompt: 'Build PropTech Tenant Management Portal with rent analytics' },
    { id: 'media', name: 'Media Storyboard 4K Pipeline', desc: 'Creative asset generator with script-to-frame storyboard rendering.', icon: <Film className="w-5 h-5 text-pink-400" />, prompt: 'Build Media Studio 4K Video Storyboard asset pipeline' },
  ];

  const teamActivities = [
    { user: 'Elena Rostova', action: 'Approved AST AST-789 node rewrite', time: '5m ago', avatar: '👩‍💻' },
    { user: 'Marcus Vance', action: 'Triggered Cloud Run deployment v2.4.1', time: '18m ago', avatar: '👨‍💻' },
    { user: 'Coder Agent', action: 'Synthesized 1,420 lines of type-safe TS', time: '32m ago', avatar: '🤖' },
  ];

  const runningDeployments = [
    { name: 'Aethel Production API', url: 'https://ais-dev-ipdlb.run.app', status: 'Healthy', latency: '12ms', rps: '1,890/s', region: 'europe-west2' },
    { name: 'PropTech Lease Microservice', url: 'https://ais-pre-ipdlb.run.app', status: 'Healthy', latency: '18ms', rps: '450/s', region: 'us-central1' },
  ];

  return (
    <div className={`space-y-8 pb-16 transition-colors duration-200 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* 1. WELCOME HEADER */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
      }`}>
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              OPROX HQ Command Center
            </span>
            <span className="text-xs text-slate-400">● Live Workspace Active</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, Lead Architect 👋
          </h1>
          <p className={`text-xs sm:text-sm max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Your 6 autonomous AI agents are idle and ready. 2 deployments are healthy on Cloud Run.
          </p>
        </div>

        {/* Quick Launch Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => onNavigateMode('ide')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Application</span>
          </button>

          <button
            onClick={() => onNavigateMode('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
            }`}
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>Database Studio</span>
          </button>
        </div>
      </div>

      {/* SEARCH & REORDER / FILTER CONTROL BAR */}
      <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, files, agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs border focus:outline-none ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Cards' },
            { id: 'projects', label: 'Projects & Files' },
            { id: 'agents', label: 'Agents & Activity' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveSectionFilter(f.id as any)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSectionFilter === f.id
                  ? isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. CONTINUE WORKING BANNER */}
      <div className={`p-6 rounded-2xl border space-y-4 relative ${
        isDark ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-emerald-500/30' : 'bg-gradient-to-r from-emerald-50/50 via-white to-indigo-50/50 border-emerald-300 shadow-md'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Active Session In Progress
              </span>
            </div>
            <h3 className="font-bold text-base">OPROX Enterprise Core • AST Pipeline Stage 14/18</h3>
            <p className="text-xs text-slate-400">
              Prompt: "Build an enterprise multi-tenant analytics dashboard with JWT auth, Postgres ERD schema, and live telemetry monitors"
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateMode('ai-os')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>AI Studio OS</span>
            </button>

            <button
              onClick={() => onNavigateMode('ide')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 cursor-pointer"
            >
              <span>Resume IDE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Compilation Progress</span>
            <span>78% Complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[78%]" />
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER COLUMNS (2 COLS) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* RECENT PROJECTS */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base">Recent Projects</h2>
              </div>
              <button
                onClick={() => onNavigateMode('showcase')}
                className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {RECENT_PROJECTS.map((proj) => {
                const isFav = favoriteProjects.includes(proj.id);
                return (
                  <div
                    key={proj.id}
                    className={`p-4 rounded-xl border space-y-3 transition-all hover:scale-[1.01] ${
                      isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{proj.icon}</span>
                        <div>
                          <h3 className="font-bold text-xs">{proj.title}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">{proj.updatedAt}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(proj.id)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                          isFav ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        {proj.category}
                      </span>

                      <button
                        onClick={() => onLaunchIdeWithPrompt(proj.description, proj.title)}
                        className="text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open IDE</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RUNNING AGENTS STATUS */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-base">Running Agents Overview</h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">6/6 Agents Idle</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{agent.avatar}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {agent.id}
                    </span>
                  </div>
                  <p className="font-bold text-xs">{agent.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{agent.specialty}</p>
                </div>
              ))}
            </div>
          </div>

          {/* USAGE STATISTICS & METRICS CHART */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-base">Resource & AST Usage Statistics</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Last 24 Hours</span>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={USAGE_CHART_DATA}>
                  <defs>
                    <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#020617', borderColor: '#1e293b', fontSize: '11px', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="tokens" stroke="#10b981" fillOpacity={1} fill="url(#tokenGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TEMPLATES GALLERY */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-base">Adaptive Templates Gallery</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templatesList.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between ${
                    isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {tpl.icon}
                      <h3 className="font-bold text-xs">{tpl.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{tpl.desc}</p>
                  </div>

                  <button
                    onClick={() => onLaunchIdeWithPrompt(tpl.prompt, tpl.name)}
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                  >
                    Launch Mold
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1 COL) */}
        <div className="space-y-8">
          
          {/* NOTIFICATIONS CENTER */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base">Notifications Center</h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                {filteredNotifications.length} New
              </span>
            </div>

            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">All notifications dismissed</p>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border space-y-1 relative ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-emerald-400">{notif.title}</span>
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{notif.desc}</p>
                    <span className="text-[10px] text-slate-500 font-mono block pt-1">{notif.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DEPLOYMENTS OVERVIEW */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-pink-400" />
                <h2 className="font-bold text-base">Active Deployments</h2>
              </div>
              <button
                onClick={() => onNavigateMode('cloud')}
                className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {runningDeployments.map((dep, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border space-y-2 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{dep.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {dep.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 truncate">{dep.url}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                    <span>Latency: {dep.latency}</span>
                    <span>RPS: {dep.rps}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STORAGE OVERVIEW */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-teal-400" />
              <h2 className="font-bold text-base">Virtual Storage Allocation</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 font-mono">
                <span>VFS Memory Node</span>
                <span>24.8 MB / 512 MB</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full w-[15%]" />
              </div>
            </div>
          </div>

          {/* RECENT FILES */}
          <div className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-base">Recent VFS Files</h2>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {recentFiles.map((rf, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigateMode('ide')}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-slate-200">{rf.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{rf.updated}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WORKSPACE SHORTCUTS */}
          <div className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              <Command className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-base">Shortcuts Cheatsheet</h2>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Open Code IDE</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-200">⌘ + I</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Database Studio</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-200">⌘ + D</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Run AST Pipeline</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-200">⌘ + Enter</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
