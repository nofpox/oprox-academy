import React, { useState } from 'react';
import {
  FileText,
  Brain,
  History,
  Paperclip,
  BookOpen,
  Plus,
  Trash2,
  Check,
  Code2,
  Database,
  FileCode,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ContextItem, MemoryItem, PromptTemplate } from '../../types';

interface ContextMemoryPanelProps {
  contextItems: ContextItem[];
  onToggleContextItem: (id: string) => void;
  memoryItems: MemoryItem[];
  onAddMemory: (key: string, value: string, category: 'Convention' | 'Preference' | 'API Spec' | 'Architecture') => void;
  templates: PromptTemplate[];
  onSelectTemplate: (template: PromptTemplate) => void;
  theme?: 'dark' | 'light';
}

export const ContextMemoryPanel: React.FC<ContextMemoryPanelProps> = ({
  contextItems,
  onToggleContextItem,
  memoryItems,
  onAddMemory,
  templates,
  onSelectTemplate,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'context' | 'memory' | 'templates' | 'history'>('context');

  // New Memory Input
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<'Convention' | 'Preference' | 'API Spec' | 'Architecture'>('Convention');

  // History sessions
  const [historySessions, setHistorySessions] = useState([
    { id: 'sess-1', title: 'Multi-Tenant Auth API Scaffold', date: 'Today, 10:14 AM', tokenCount: '12.4K' },
    { id: 'sess-2', title: 'Drizzle PostgreSQL Schema Migration', date: 'Yesterday', tokenCount: '8.1K' },
    { id: 'sess-3', title: 'Cloud Run Single-File Server Bundling', date: '2 days ago', tokenCount: '18.2K' }
  ]);

  const handleCreateMemory = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    onAddMemory(newKey, newValue, newCategory);
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className={`h-full flex flex-col border-l overflow-hidden select-none ${
      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      {/* Icon Tab Navigation Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 bg-slate-900 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('context')}
            title="Active Context & Attachments"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'context' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            title="Enterprise Memory Store"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'memory' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            title="Prompt Templates & Blueprints"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'templates' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('history')}
            title="AI History & Checkpoints"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'history' ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          {activeTab}
        </span>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
        
        {/* 1. CONTEXT & ATTACHMENTS PANEL */}
        {activeTab === 'context' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono">
                Active Context Attachments
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {contextItems.filter((c) => c.isSelected).length} Included
              </span>
            </div>

            <div className="space-y-2">
              {contextItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onToggleContextItem(item.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    item.isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-100'
                      : 'bg-slate-900 border-slate-800 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono font-bold text-xs truncate max-w-[160px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{item.tokenCount} tokens</span>
                  </div>
                  {item.snippet && (
                    <p className="text-[10px] font-mono text-slate-400 truncate bg-slate-950 p-1 rounded">
                      {item.snippet}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Attach File Simulation Button */}
            <button className="w-full py-2 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300 font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Attach File / Doc to Context</span>
            </button>
          </div>
        )}

        {/* 2. MEMORY PANEL */}
        {activeTab === 'memory' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono">
                Enterprise Long-Term Memory
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">
                {memoryItems.length} Saved Rules
              </span>
            </div>

            {/* Memory List */}
            <div className="space-y-2">
              {memoryItems.map((mem) => (
                <div key={mem.id} className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-emerald-400">{mem.key}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{mem.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">{mem.value}</p>
                </div>
              ))}
            </div>

            {/* Add Memory Form */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900 space-y-2 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                Inject Custom Enterprise Constraint
              </span>
              <input
                type="text"
                placeholder="Constraint Name (e.g. 'DB Timeout Policy')"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono focus:outline-none"
              />
              <textarea
                placeholder="Rule value / requirement description..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={2}
                className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono focus:outline-none"
              />
              <button
                onClick={handleCreateMemory}
                className="w-full py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors"
              >
                Save to Enterprise Memory
              </button>
            </div>
          </div>
        )}

        {/* 3. PROMPT TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono block">
              Pre-Built Prompt Library ({templates.length})
            </span>
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => onSelectTemplate(tmpl)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-emerald-500/40 cursor-pointer space-y-1.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{tmpl.title}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{tmpl.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. HISTORY PANEL */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px] font-mono block">
              AI Session Checkpoints
            </span>
            <div className="space-y-2">
              {historySessions.map((sess) => (
                <div key={sess.id} className="p-3 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{sess.title}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{sess.tokenCount}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">{sess.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
