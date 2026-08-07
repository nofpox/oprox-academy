import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Sparkles, 
  Download, 
  Split, 
  Check, 
  ShieldAlert, 
  FileCode, 
  Zap, 
  Copy,
  RefreshCw
} from 'lucide-react';
import { OpenTab } from '../../types';

interface CodeEditorProps {
  openTabs: OpenTab[];
  activeTabPath: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onContentChange: (path: string, newContent: string) => void;
  onSaveFile: (path: string) => void;
  onRequestAiAction: (actionType: string, path: string, content: string) => void;
  proposedCodeDiff?: { original: string; proposed: string } | null;
  onAcceptDiff?: () => void;
  onRejectDiff?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  openTabs,
  activeTabPath,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onSaveFile,
  onRequestAiAction,
  proposedCodeDiff,
  onAcceptDiff,
  onRejectDiff,
}) => {
  const [copied, setCopied] = useState(false);
  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  if (!activeTab) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 p-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
          <FileCode className="w-8 h-8" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-slate-300 font-bold text-sm">No File Open</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Select a file from the VFS tree on the left or prompt the OPROX Multi-Agent team to scaffold code.
          </p>
        </div>
      </div>
    );
  }

  const lines = activeTab.content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeTab.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeTab.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200">
      {/* Tab Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border-b border-slate-800 overflow-x-auto">
        <div className="flex items-center overflow-x-auto max-w-[80%]">
          {openTabs.map((tab) => {
            const isActive = tab.path === activeTabPath;
            return (
              <div
                key={tab.path}
                onClick={() => onSelectTab(tab.path)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono cursor-pointer border-r border-slate-800/80 transition-all min-w-[130px] justify-between ${
                  isActive
                    ? 'bg-slate-950 text-emerald-400 font-semibold border-t-2 border-t-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">{tab.name}</span>
                  {tab.isModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.path);
                  }}
                  className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 px-3 py-1">
          <button
            onClick={() => onRequestAiAction('Refactor', activeTab.path, activeTab.content)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition-colors"
            title="AI Refactor Code"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>AI Refactor</span>
          </button>

          <button
            onClick={() => onRequestAiAction('Security Audit', activeTab.path, activeTab.content)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition-colors"
            title="Security Audit"
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Audit</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            title="Download File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSaveFile(activeTab.path)}
            disabled={!activeTab.isModified}
            className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-all ${
              activeTab.isModified
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-3 h-3" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* AI Diff Preview Overlay if present */}
      {proposedCodeDiff && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">AI Proposed Changes for {activeTab.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRejectDiff}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Discard
            </button>
            <button
              onClick={onAcceptDiff}
              className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
            >
              Accept Changes
            </button>
          </div>
        </div>
      )}

      {/* Editor Main Canvas */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs">
        {proposedCodeDiff ? (
          /* Split Diff View */
          <div className="grid grid-cols-2 w-full h-full divide-x divide-slate-800 overflow-y-auto">
            {/* Original */}
            <div className="p-4 bg-slate-950 space-y-1">
              <p className="text-[10px] uppercase font-bold text-rose-400 mb-2">Original Code</p>
              <pre className="text-slate-400 whitespace-pre-wrap">{proposedCodeDiff.original}</pre>
            </div>
            {/* Proposed */}
            <div className="p-4 bg-slate-900/60 space-y-1">
              <p className="text-[10px] uppercase font-bold text-emerald-400 mb-2">AI Generated Patch</p>
              <pre className="text-emerald-300 whitespace-pre-wrap">{proposedCodeDiff.proposed}</pre>
            </div>
          </div>
        ) : (
          /* Standard Code Editor with Line Numbers */
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Line Numbers */}
            <div className="w-12 py-3 bg-slate-950 text-slate-600 text-right pr-3 select-none border-r border-slate-900 font-mono text-[11px] space-y-0.5">
              {lines.map((_, idx) => (
                <div key={idx}>{idx + 1}</div>
              ))}
            </div>

            {/* Editable Text Area */}
            <textarea
              value={activeTab.content}
              onChange={(e) => onContentChange(activeTab.path, e.target.value)}
              spellCheck={false}
              className="flex-1 p-3 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-0 selection:bg-slate-800 selection:text-emerald-300"
            />
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-3 py-1 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>Path: {activeTab.path}</span>
          <span>Length: {activeTab.content.length} chars</span>
          <span>Lines: {lines.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-semibold uppercase">{activeTab.language}</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
