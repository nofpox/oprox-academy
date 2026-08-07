import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Sparkles,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  Box,
  Server,
  Globe,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { ProjectGeneratorConfig } from '../../types';

interface AiProjectGeneratorProps {
  theme?: 'dark' | 'light';
  onProjectGenerated?: (config: ProjectGeneratorConfig, files: { path: string; content: string }[]) => void;
}

export const AiProjectGenerator: React.FC<AiProjectGeneratorProps> = ({
  theme = 'dark',
  onProjectGenerated
}) => {
  const isDark = theme === 'dark';

  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Config
  const [config, setConfig] = useState<ProjectGeneratorConfig>({
    projectName: 'Oprox Enterprise Microservice',
    description: 'Autonomous high-performance microservice platform with Drizzle PostgreSQL & Cloud Run deployment.',
    template: 'fullstack',
    architecture: 'modular_monolith',
    techStack: 'react_node',
    database: 'postgresql_drizzle',
    auth: 'jwt',
    deploymentTarget: 'cloud_run',
    createdAt: new Date().toISOString()
  });

  const templates = [
    { id: 'fullstack', title: 'Fullstack Web App', desc: 'React 18 + Express + Drizzle ORM + Tailwind CSS', icon: <Box className="w-5 h-5 text-emerald-400" /> },
    { id: 'microservices', title: 'Microservices Mesh', desc: 'Decoupled API services with gRPC & RabbitMQ messaging', icon: <Server className="w-5 h-5 text-cyan-400" /> },
    { id: 'mobile', title: 'Cross-Platform Mobile', desc: 'React Native / Expo + Node backend API gateway', icon: <Smartphone className="w-5 h-5 text-purple-400" /> },
    { id: 'api_gateway', title: 'API Gateway & Auth', desc: 'High-throughput OAuth2 rate-limited reverse proxy', icon: <Globe className="w-5 h-5 text-amber-400" /> },
    { id: 'realtime_dashboard', title: 'Realtime Analytics Dashboard', desc: 'WebSocket / SSE stream visualizer with D3 charts', icon: <Cpu className="w-5 h-5 text-rose-400" /> }
  ];

  const architectures = [
    { id: 'monolith', title: 'Monolithic Architecture', desc: 'Single deployment artifact for fast development' },
    { id: 'modular_monolith', title: 'Modular Monolith', desc: 'Strict domain module boundaries in a single codebase' },
    { id: 'microservices', title: 'Microservices Architecture', desc: 'Independently deployable service domain nodes' },
    { id: 'serverless', title: 'Serverless Functions', desc: 'Stateless auto-scaling Cloud Run & Lambda handlers' },
    { id: 'event_driven', title: 'Event-Driven Architecture', desc: 'Async message queues with Kafka or Pub/Sub' }
  ];

  const techStacks = [
    { id: 'react_node', title: 'React 18 + Node.js (TypeScript)', desc: 'Standard production TypeScript stack' },
    { id: 'next_express', title: 'Next.js App Router + Express', desc: 'Server-side rendering with API proxy routes' },
    { id: 'vue_vite', title: 'Vue 3 + Vite + Express', desc: 'Lightweight reactive frontend with Express backend' },
    { id: 'python_fastapi', title: 'Python 3.11 + FastAPI', desc: 'High-speed async API with Pydantic validation' },
    { id: 'go_gin', title: 'Go 1.22 + Gin Framework', desc: 'Ultra-fast compiled backend binary microservices' }
  ];

  const databases = [
    { id: 'postgresql_drizzle', title: 'PostgreSQL + Drizzle ORM', desc: 'Relational ACID compliant with type-safe queries' },
    { id: 'firestore', title: 'Firebase Firestore', desc: 'Realtime NoSQL cloud document collection database' },
    { id: 'mongodb', title: 'MongoDB + Mongoose', desc: 'Schemaless document persistence engine' },
    { id: 'mysql', title: 'MySQL / MariaDB', desc: 'Standard enterprise relational data engine' },
    { id: 'sqlite', title: 'SQLite / Turso DB', desc: 'Embedded lightweight relational database' }
  ];

  const authOptions = [
    { id: 'jwt', title: 'JWT Access & Refresh Tokens', desc: 'Stateless bearer token authentication' },
    { id: 'oauth2', title: 'Google / GitHub OAuth 2.0', desc: 'Social and enterprise identity login provider' },
    { id: 'firebase_auth', title: 'Firebase Authentication', desc: 'Managed auth solution with multi-factor auth' },
    { id: 'clerk', title: 'Clerk User Management', desc: 'Turnkey pre-built auth modals & session tokens' },
    { id: 'auth0', title: 'Auth0 Enterprise SSO', desc: 'SAML & OIDC enterprise identity provider' }
  ];

  const deploymentTargets = [
    { id: 'cloud_run', title: 'Google Cloud Run', desc: 'Serverless container auto-scaling (Port 3000)' },
    { id: 'vercel', title: 'Vercel Serverless', desc: 'Global edge deployment platform' },
    { id: 'aws_ecs', title: 'AWS ECS Fargate', desc: 'Managed container orchestration' },
    { id: 'docker_swarm', title: 'Docker Swarm Cluster', desc: 'Self-hosted lightweight container cluster' },
    { id: 'kubernetes', title: 'Kubernetes Cluster (K8s)', desc: 'Enterprise helm chart container cluster' }
  ];

  const handleGenerateProject = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/phase3/project-generator/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedSuccess(true);
        if (onProjectGenerated) {
          onProjectGenerated(data.projectConfig, data.generatedFiles);
        }
        setTimeout(() => setGeneratedSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to synthesize project.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with project generator backend.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border transition-colors shadow-2xl ${
      isDark ? 'bg-slate-950 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
    }`}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-slate-950 shadow-lg shadow-blue-500/25">
            <FolderPlus className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">AI Project Generator & Scaffold Wizard</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Authoritative VFS Scaffold
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-File Scaffold Synthesis • Real VFS Scaffolding • Workspace Integration
            </p>
          </div>
        </div>

        {/* Wizard Progress Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <button
              key={step}
              onClick={() => setWizardStep(step)}
              className={`w-7 h-7 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                wizardStep === step
                  ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20'
                  : wizardStep > step
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {wizardStep > step ? <Check className="w-3.5 h-3.5" /> : step}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Project Metadata */}
      {wizardStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <span>Step 1 of 6: Project Identity & Specification</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Project Name</label>
              <input
                type="text"
                value={config.projectName}
                onChange={(e) => setConfig({ ...config, projectName: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Project Functional Description</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Project Template */}
      {wizardStep === 2 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Step 2 of 6: Select Project Template Archetype
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setConfig({ ...config, template: tpl.id as any })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  config.template === tpl.id
                    ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {tpl.icon}
                  <h4 className="text-xs font-extrabold text-slate-100">{tpl.title}</h4>
                </div>
                <p className="text-[11px] text-slate-400">{tpl.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Architecture Selection */}
      {wizardStep === 3 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Step 3 of 6: Architectural Pattern Selection
          </h3>

          <div className="space-y-2">
            {architectures.map((arch) => (
              <div
                key={arch.id}
                onClick={() => setConfig({ ...config, architecture: arch.id as any })}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  config.architecture === arch.id
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{arch.title}</h4>
                  <p className="text-[11px] text-slate-400">{arch.desc}</p>
                </div>
                {config.architecture === arch.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Tech Stack Selection */}
      {wizardStep === 4 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Step 4 of 6: Programming Language & Framework Stack
          </h3>

          <div className="space-y-2">
            {techStacks.map((st) => (
              <div
                key={st.id}
                onClick={() => setConfig({ ...config, techStack: st.id as any })}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  config.techStack === st.id
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{st.title}</h4>
                  <p className="text-[11px] text-slate-400">{st.desc}</p>
                </div>
                {config.techStack === st.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Database & Auth */}
      {wizardStep === 5 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Step 5 of 6: Database & Authentication Engine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase block">Database System</label>
              {databases.map((db) => (
                <div
                  key={db.id}
                  onClick={() => setConfig({ ...config, database: db.id as any })}
                  className={`p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                    config.database === db.id ? 'bg-blue-950/40 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold block">{db.title}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase block">Auth System</label>
              {authOptions.map((au) => (
                <div
                  key={au.id}
                  onClick={() => setConfig({ ...config, auth: au.id as any })}
                  className={`p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                    config.auth === au.id ? 'bg-blue-950/40 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold block">{au.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Deployment Target & Summary */}
      {wizardStep === 6 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Step 6 of 6: Deployment Target & Final Synthesis
          </h3>

          <div className="space-y-2">
            {deploymentTargets.map((dt) => (
              <div
                key={dt.id}
                onClick={() => setConfig({ ...config, deploymentTarget: dt.id as any })}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  config.deploymentTarget === dt.id ? 'bg-blue-950/40 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block text-slate-200">{dt.title}</span>
                  <span className="text-[10px] text-slate-500">{dt.desc}</span>
                </div>
                {config.deploymentTarget === dt.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
            <span className="text-blue-400 font-bold block">Selected Configuration Summary</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-300 text-[11px]">
              <div>Name: <span className="text-emerald-400">{config.projectName}</span></div>
              <div>Template: <span className="text-emerald-400">{config.template}</span></div>
              <div>Arch: <span className="text-emerald-400">{config.architecture}</span></div>
              <div>Stack: <span className="text-emerald-400">{config.techStack}</span></div>
              <div>DB: <span className="text-emerald-400">{config.database}</span></div>
              <div>Deploy: <span className="text-emerald-400">{config.deploymentTarget}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation & Action Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800/60 mt-6">
        <button
          onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
          disabled={wizardStep === 1}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {wizardStep < 6 ? (
          <button
            onClick={() => setWizardStep(wizardStep + 1)}
            className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleGenerateProject}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 hover:opacity-95 text-slate-950 font-extrabold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Project...' : generatedSuccess ? 'Project Created!' : 'Synthesize Complete Project'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
