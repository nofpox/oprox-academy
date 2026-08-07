import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  ChevronDown,
  FilePlus,
  FolderPlus,
  Edit2,
  Copy,
  Move,
  Filter,
  Check
} from 'lucide-react';
import { VFSNode } from '../../types';

interface VFSTreeProps {
  nodes: VFSNode[];
  activePath: string | null;
  onSelectFile: (node: VFSNode) => void;
  onCreateNode: (parentPath: string, name: string, type: 'file' | 'directory') => void;
  onDeleteNode: (path: string) => void;
  onRenameNode?: (oldPath: string, newName: string) => void;
  onDuplicateNode?: (path: string) => void;
}

export const VFSTree: React.FC<VFSTreeProps> = ({
  nodes,
  activePath,
  onSelectFile,
  onCreateNode,
  onDeleteNode,
  onRenameNode,
  onDuplicateNode,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    '/src': true,
    '/src/components': true,
    '/src/services': true,
    '/src/lib': true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'ts' | 'json' | 'md' | 'sql'>('all');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<{ parentPath: string; type: 'file' | 'directory' } | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<{ path: string; currentName: string } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [copiedPathToast, setCopiedPathToast] = useState<string | null>(null);

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />;
    if (fileName.endsWith('.md')) return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (fileName.endsWith('.sql')) return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !showCreateModal) return;
    onCreateNode(showCreateModal.parentPath, newItemName.trim(), showCreateModal.type);
    setShowCreateModal(null);
    setNewItemName('');
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || !showRenameModal) return;
    if (onRenameNode) {
      onRenameNode(showRenameModal.path, renameValue.trim());
    }
    setShowRenameModal(null);
    setRenameValue('');
  };

  const copyPathToClipboard = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPathToast(path);
    setTimeout(() => setCopiedPathToast(null), 2000);
  };

  const matchesFilter = (fileName: string) => {
    if (fileTypeFilter === 'all') return true;
    if (fileTypeFilter === 'ts') return fileName.endsWith('.ts') || fileName.endsWith('.tsx');
    if (fileTypeFilter === 'json') return fileName.endsWith('.json');
    if (fileTypeFilter === 'md') return fileName.endsWith('.md');
    if (fileTypeFilter === 'sql') return fileName.endsWith('.sql');
    return true;
  };

  const renderNode = (node: VFSNode, level = 0) => {
    if (searchQuery) {
      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (node.type === 'file' && !matchesSearch) return null;
    }

    if (node.type === 'file' && !matchesFilter(node.name)) {
      return null;
    }

    const isExpanded = expandedPaths[node.path] ?? false;
    const isActive = activePath === node.path;

    if (node.type === 'directory') {
      return (
        <div key={node.path} className="select-none">
          <div
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:bg-slate-800/60 group ${
              isActive ? 'bg-slate-800 text-white' : 'text-slate-300'
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => toggleExpand(node.path)}
          >
            <div className="flex items-center gap-1.5 truncate">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                title="New File in directory"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal({ parentPath: node.path, type: 'file' });
                }}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                title="New Subdirectory"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal({ parentPath: node.path, type: 'directory' });
                }}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {isExpanded && node.children && (
            <div className="space-y-0.5">
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        onClick={() => onSelectFile(node)}
        className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all group ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-300 font-semibold border-l-2 border-emerald-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        }`}
        style={{ paddingLeft: `${level * 12 + 22}px` }}
      >
        <div className="flex items-center gap-2 truncate">
          {getFileIcon(node.name)}
          <span className="truncate">{node.name}</span>
          {node.isModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
        </div>

        {/* Hover Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            title="Copy Path"
            onClick={(e) => copyPathToClipboard(node.path, e)}
            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200"
          >
            <Copy className="w-3 h-3" />
          </button>

          {onRenameNode && (
            <button
              title="Rename file"
              onClick={(e) => {
                e.stopPropagation();
                setShowRenameModal({ path: node.path, currentName: node.name });
                setRenameValue(node.name);
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-400"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}

          <button
            title="Delete file"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.path);
            }}
            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-r border-slate-800 text-slate-200">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Virtual Workspace (VFS)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateModal({ parentPath: '/src', type: 'file' })}
              className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded text-slate-300 hover:text-emerald-400 transition-colors"
              title="Add File to /src"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowCreateModal({ parentPath: '/src', type: 'directory' })}
              className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded text-slate-300 hover:text-amber-400 transition-colors"
              title="Add Directory to /src"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search VFS files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* File Type Filter Pills */}
        <div className="flex items-center gap-1 pt-1 overflow-x-auto">
          {(['all', 'ts', 'json', 'md', 'sql'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFileTypeFilter(filter)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                fileTypeFilter === filter
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Copy Toast Alert */}
      {copiedPathToast && (
        <div className="p-2 bg-emerald-500/10 border-b border-emerald-500/20 text-[11px] text-emerald-400 font-bold flex items-center justify-between px-3">
          <span className="truncate">Copied: {copiedPathToast}</span>
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {nodes.map((node) => renderNode(node))}
      </div>

      {/* New Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-white text-sm">
              Create New {showCreateModal.type === 'file' ? 'File' : 'Directory'} in{' '}
              <span className="text-emerald-400">{showCreateModal.parentPath}</span>
            </h3>

            <input
              type="text"
              placeholder={showCreateModal.type === 'file' ? 'e.g. authService.ts' : 'e.g. utils'}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleRenameSubmit}
            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl"
          >
            <h3 className="font-bold text-white text-sm">
              Rename Item: <span className="text-amber-400">{showRenameModal.currentName}</span>
            </h3>

            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRenameModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
