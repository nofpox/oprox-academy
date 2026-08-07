import React, { useState } from 'react';
import {
  ShoppingBag,
  BookOpen,
  GraduationCap,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Send,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Radio,
  FileText,
  ThumbsUp,
  Search,
  Plus
} from 'lucide-react';
import { PlatformViewId } from './platformTypes';

interface EcosystemViewsProps {
  viewId: PlatformViewId;
  theme?: 'dark' | 'light';
}

export const EcosystemAndSupportViews: React.FC<EcosystemViewsProps> = ({ viewId, theme = 'dark' }) => {
  // Support Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketBody, setTicketBody] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Feedback State
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackVotes, setFeedbackVotes] = useState<Record<string, number>>({
    f1: 42,
    f2: 28,
    f3: 19
  });

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketBody('');
      setTicketSubmitted(false);
    }, 2500);
  };

  if (viewId === 'marketplace') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>OPROX Ecosystem Marketplace & Plugin Extension Store</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Discover certified third-party integrations, AI swarm plugins, and domain modules.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
            24 Modules Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {[
            { title: 'OPROX Media Studio 4K', cat: 'Media', desc: 'Generative prompt specs & storyboard engine.' },
            { title: 'OPROX PropTech Yield', cat: 'Real Estate', desc: 'NOI, cap rate calculation & lease analytics.' },
            { title: 'OPROX Autonomous Swarm', cat: 'Developer Tools', desc: '6-agent AST code generation factory.' }
          ].map((m, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">{m.cat}</span>
              <h3 className="font-extrabold text-white text-sm">{m.title}</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">{m.desc}</p>
              <button className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer transition-all text-xs">
                Install Module
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewId === 'templates') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Architecture Starter Blueprints & Boilerplate Stacks</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Pre-configured full-stack templates built with React, Vite, Express, and Drizzle PostgreSQL.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {[
            { name: 'Full-Stack Express + Drizzle Stack', stack: 'React 18 • Vite • Express • Drizzle ORM' },
            { name: 'AI Media Studio Starter Blueprint', stack: 'React • Gemini API • Canvas Visualizer' },
            { name: 'Enterprise ERP Multi-Tenant Template', stack: 'React • Tailwind • RBAC Security Matrix' }
          ].map((t, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="font-extrabold text-white text-sm">{t.name}</h3>
              <p className="text-emerald-400 text-[11px] font-bold">{t.stack}</p>
              <button className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-all text-xs">
                Clone Template
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewId === 'documentation') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>OPROX Developer Documentation & API Specification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Comprehensive guides for REST API endpoints, TypeScript SDKs, and Gemini Flash integration.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-3">
          <span className="text-emerald-400 font-bold block">Quickstart Curl Example</span>
          <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px] overflow-x-auto">
{`curl -X POST https://api.oprox.io/v1/solutions/generate \\
  -H "Authorization: Bearer op_live_89410f..." \\
  -H "Content-Type: application/json" \\
  -d '{"solutionId": "sol-media-studio", "prompt": "4K reveal"}'`}
          </pre>
        </div>
      </div>
    );
  }

  if (viewId === 'learning-center') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <span>Interactive Learning Academy & Certification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Master multi-agent orchestration, Drizzle ORM migrations, and PropTech yield analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white block">Course: Autonomous AI Swarms 101</span>
            <p className="text-slate-400 text-[11px]">Duration: 45 mins • 4 Video Modules • Certificate Badge</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white block">Course: Enterprise PropTech Yield Modeling</span>
            <p className="text-slate-400 text-[11px]">Duration: 30 mins • 3 Video Modules • Certificate Badge</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewId === 'help-center') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <span>Help Center & Knowledge Base Search</span>
          </h2>
        </div>

        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs, error codes, deployment issues..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>
    );
  }

  if (viewId === 'support') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none max-w-2xl">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-indigo-400" />
            <span>Enterprise SLA Support Ticket Portal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Direct 15-minute priority SLA support channel with OPROX Infrastructure Engineers.
          </p>
        </div>

        <form onSubmit={handleSupportSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Ticket Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Query performance on Drizzle PostgreSQL cluster"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Detailed Description</label>
            <textarea
              rows={4}
              required
              placeholder="Provide relevant build logs, timestamps, or steps to reproduce..."
              value={ticketBody}
              onChange={(e) => setTicketBody(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold cursor-pointer transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{ticketSubmitted ? 'Ticket Submitted to Priority SLA Queue!' : 'Submit Support Ticket'}</span>
          </button>
        </form>
      </div>
    );
  }

  if (viewId === 'contact') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 select-none font-mono text-xs">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <span>Contact Enterprise Solutions Engineering</span>
        </h2>
        <p className="text-slate-300">Email: <strong className="text-emerald-400">enterprise@oprox.io</strong></p>
        <p className="text-slate-300">Headquarters: OPROX Global Tower, San Francisco, CA</p>
      </div>
    );
  }

  if (viewId === 'feedback') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none font-mono text-xs">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-indigo-400" />
            <span>Product Roadmap & Feature Feedback Board</span>
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { id: 'f1', title: 'Add multi-region failover for Drizzle PostgreSQL cluster', category: 'Database' },
            { id: 'f2', title: 'Export 4K video renders directly to Google Drive / Dropbox', category: 'Media Studio' },
            { id: 'f3', title: 'Provide dark / light theme override toggle in header', category: 'UI / UX' }
          ].map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold block">{item.category}</span>
                <span className="font-bold text-white text-xs">{item.title}</span>
              </div>
              <button
                onClick={() => setFeedbackVotes((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-bold cursor-pointer flex items-center gap-1.5"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{feedbackVotes[item.id] || 0} Votes</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewId === 'changelog') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none font-mono text-xs">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>OPROX Platform Version Release Changelog</span>
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">v3.8.0 Release - Complete Platform Suite</span>
              <span className="text-emerald-400 font-bold">July 30, 2026</span>
            </div>
            <p className="text-slate-400">Added complete platform views for Organization, Security Center, Billing, and Solutions Hub.</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewId === 'blog') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none font-mono text-xs">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Engineering Blog & Architectural Deep Dives</span>
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="font-bold text-white text-sm block">Building Sub-Second Gemini Flash AI Agent Swarms</span>
          <p className="text-slate-400 text-[11px]">Published July 28, 2026 • By Alex Morgan</p>
        </div>
      </div>
    );
  }

  if (viewId === 'status-page') {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 select-none font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              <span>OPROX Infrastructure Operational Status</span>
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            All Systems Operational
          </span>
        </div>

        <div className="space-y-3">
          {[
            { service: 'Gemini Flash AI Inference Cluster', uptime: '100%' },
            { service: 'Google Cloud Run Container Runtime', uptime: '99.99%' },
            { service: 'Drizzle PostgreSQL Database Cluster', uptime: '100%' },
            { service: 'Global Edge CDN Storage', uptime: '100%' }
          ].map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="font-bold text-white">{s.service}</span>
              <span className="text-emerald-400 font-bold">{s.uptime} Operational</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
