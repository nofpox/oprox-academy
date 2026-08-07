import React, { useState, useEffect } from 'react';
import { X, Plus, FolderPlus, Trash2, Check, RefreshCw, Layers, Sparkles, Folder } from 'lucide-react';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  updatedAt: string;
  icon: string;
}

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectTitle: string;
  onSelectProject: (title: string) => void;
  theme?: 'dark' | 'light';
}

export const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  isOpen,
  onClose,
  activeProjectTitle,
  onSelectProject,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Enterprise Core');
  const [newIcon, setNewIcon] = useState('⚡');
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      }
    } catch (err: any) {
      setError('Failed to load workspace projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer usr_admin01',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || 'Custom OPROX Workspace Project',
          category: newCategory,
          icon: newIcon,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.project) {
          setProjects((prev) => [data.project, ...prev]);
          onSelectProject(data.project.title);
          setShowCreateForm(false);
          setNewTitle('');
          setNewDesc('');
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to create project');
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete workspace project "${title}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer usr_admin01',
        },
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (activeProjectTitle === title && projects.length > 1) {
          const remaining = projects.filter((p) => p.id !== id);
          if (remaining.length > 0) onSelectProject(remaining[0].title);
        }
      }
    } catch (err) {
      setError('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Workspace Project Manager</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Switch, create, and manage OPROX platform workspace applications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Workspace Projects ({projects.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchProjects}
                disabled={loading}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs shadow-md hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{showCreateForm ? 'Cancel' : 'New Project'}</span>
              </button>
            </div>
          </div>

          {/* New Project Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreateProject}
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-950 border-emerald-500/30' : 'bg-slate-50 border-emerald-300'
              }`}
            >
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <FolderPlus className="w-4 h-4" />
                <span>Create New Workspace Application</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FinTech Billing Engine"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Icon Emoji</label>
                  <input
                    type="text"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border text-center focus:outline-none ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Category / Domain</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Enterprise Core">Enterprise Core</option>
                  <option value="Backend REST">Backend REST API</option>
                  <option value="PropTech OS">PropTech OS</option>
                  <option value="Media AI">Media AI Pipeline</option>
                  <option value="Custom App">Custom Application</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide a brief functional overview..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all"
                >
                  Create & Launch Workspace
                </button>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="space-y-3">
            {projects.map((proj) => {
              const isActive = activeProjectTitle === proj.title;
              return (
                <div
                  key={proj.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    isActive
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-emerald-50 border-emerald-300'
                      : isDark
                      ? 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      {proj.icon || '🚀'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm">{proj.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {proj.category}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Active
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 max-w-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {proj.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectProject(proj.title);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                      >
                        Switch To
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProject(proj.id, proj.title)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
