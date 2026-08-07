import React, { useState } from 'react';
import {
  X,
  Save,
  Sparkles,
  Split,
  Check,
  FileCode,
  Zap,
  Copy,
  Columns,
  Maximize2
} from 'lucide-react';
import { OpenTab } from '../../types';

interface MultiTabEditorProps {
  openTabs: OpenTab[];
  activeTabPath: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onContentChange: (path: string, newContent: string) => void;
  onSaveFile: (path: string) => void;
  onRequestAiAction: (actionType: string, path: string, content: string) => void;
  isSplitEditor: boolean;
  onToggleSplitEditor: () => void;
  proposedCodeDiff?: { original: string; proposed: string } | null;
  onAcceptDiff?: () => void;
  onRejectDiff?: () => void;
  theme?: 'dark' | 'light';
}

export const MultiTabEditor: React.FC<MultiTabEditorProps> = ({
  openTabs,
  activeTabPath,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onSaveFile,
  onRequestAiAction,
  isSplitEditor,
  onToggleSplitEditor,
  proposedCodeDiff,
  onAcceptDiff,
  onRejectDiff,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const activeTab = openTabs.find((t) => t.path === activeTabPath);
  const secondaryTab = openTabs.find((t) => t.path !== activeTabPath) || openTabs[0];

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeTab) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-8 space-y-4 ${
        isDark ? 'bg-slate-950 text-slate-500' : 'bg-slate-100 text-slate-400'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <FileCode className="w-8 h-8" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-bold text-sm text-slate-300">No File Currently Open</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Select a file from the VFS tree on the left or prompt the OPROX AI Team to generate code.
          </p>
        </div>
      </div>
    );
  }

  const renderSingleEditor = (tab: OpenTab, isSecondary = false) => {
    const lines = tab.content.split('\n');

    return (
      <div className="h-full flex flex-col bg-slate-950 text-slate-200">
        {/* Editor Actions Toolbar */}
        <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{tab.name}</span>
            <span className="text-[10px] text-slate-500">{lines.length} lines</span>
          </div>

          <div className="flex items-center gap-2">
            {!isSecondary && (
              <div className="flex items-center gap-1">
                {['Refactor', 'Explain', 'Audit'].map((action) => (
                  <button
                    key={action}
                    onClick={() => onRequestAiAction(action, tab.path, tab.content)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    ⚡ {action}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => onSaveFile(tab.path)}
              className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 cursor-pointer"
              title="Save file"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 relative overflow-auto font-mono text-xs leading-relaxed flex">
          {/* Line Numbers Column */}
          <div className="py-3 px-3 text-right text-slate-600 bg-slate-950 select-none border-r border-slate-900">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            value={tab.content}
            onChange={(e) => onContentChange(tab.path, e.target.value)}
            spellCheck={false}
            className="flex-1 py-3 px-4 bg-slate-950 text-slate-200 resize-none focus:outline-none font-mono text-xs leading-relaxed whitespace-pre"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 select-none">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 overflow-x-auto">
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
                  className="text-slate-500 hover:text-slate-300 p-0.5 rounded hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={onToggleSplitEditor}
          className={`px-3 py-1.5 mr-2 rounded text-xs font-bold flex items-center gap-1 border cursor-pointer ${
            isSplitEditor ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>{isSplitEditor ? 'Single' : 'Split'}</span>
        </button>
      </div>

      {/* Proposed AI Diff Alert */}
      {proposedCodeDiff && (
        <div className="p-3 bg-indigo-950/80 border-b border-indigo-500/40 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>AI proposed code optimizations ready for review.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAcceptDiff}
              className="px-3 py-1 rounded bg-emerald-500 text-slate-950 font-bold cursor-pointer hover:bg-emerald-400"
            >
              Accept Diff
            </button>
            <button
              onClick={onRejectDiff}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 font-bold cursor-pointer hover:bg-slate-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Editor Body Area */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {isSplitEditor && secondaryTab ? (
          <>
            <div className="col-span-6 h-full border-r border-slate-800 overflow-hidden">
              {renderSingleEditor(activeTab)}
            </div>
            <div className="col-span-6 h-full overflow-hidden">
              {renderSingleEditor(secondaryTab, true)}
            </div>
          </>
        ) : (
          <div className="col-span-12 h-full overflow-hidden">
            {renderSingleEditor(activeTab)}
          </div>
        )}
      </div>
    </div>
  );
};
