import React, { useState, useEffect } from 'react';
import { WorkspaceHeader } from './WorkspaceHeader';
import { LeftSidebar } from './LeftSidebar';
import { MultiTabEditor } from './MultiTabEditor';
import { RightSidebar } from './RightSidebar';
import { BottomDrawer } from './BottomDrawer';
import { BottomStatusBar } from './BottomStatusBar';
import { VFSNode, OpenTab, AgentMessage, AgentRole, FactoryStage } from '../../types';
import { initialVFSTree } from '../../data/initialVFS';
import { INITIAL_FACTORY_STAGES } from '../../data/mockData';

interface OproxCodeIDEProps {
  initialPrompt?: string;
  onProjectChange?: (title: string) => void;
  theme?: 'dark' | 'light';
}

const PROJECTS_LIST = [
  'OPROX Enterprise Core',
  'Aethel Multi-Tenant Auth API',
  'PropTech Lease Portal OS',
  'Media Studio 4K Storyboard Generator'
];

export const OproxCodeIDE: React.FC<OproxCodeIDEProps> = ({
  initialPrompt,
  onProjectChange,
  theme = 'dark'
}) => {
  // Multi-Project State
  const [currentProject, setCurrentProject] = useState<string>(PROJECTS_LIST[0]);

  // VFS State
  const [vfsNodes, setVfsNodes] = useState<VFSNode[]>(initialVFSTree);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([
    {
      nodeId: 'file-app',
      path: '/src/App.tsx',
      name: 'App.tsx',
      content: initialVFSTree[3]?.children?.[0]?.content || '',
      language: 'typescript',
      isModified: false,
    },
    {
      nodeId: 'file-ai-agent',
      path: '/src/services/aiAgentService.ts',
      name: 'aiAgentService.ts',
      content: initialVFSTree[3]?.children?.[1]?.children?.[0]?.content || '',
      language: 'typescript',
      isModified: false,
    },
  ]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>('/src/App.tsx');

  // Layout & Panel Visibility State (with localStorage persistence)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showBottomDrawer, setShowBottomDrawer] = useState(true);
  const [isSplitEditor, setIsSplitEditor] = useState(false);
  const [layoutPreset, setLayoutPreset] = useState<'default' | 'split' | 'focus' | 'full-preview'>('default');

  // Load layout preferences from localStorage if available
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('oprox_ide_layout');
      if (savedLayout) {
        const parsed = JSON.parse(savedLayout);
        setShowLeftSidebar(parsed.showLeftSidebar ?? true);
        setShowRightSidebar(parsed.showRightSidebar ?? true);
        setShowBottomDrawer(parsed.showBottomDrawer ?? true);
        setIsSplitEditor(parsed.isSplitEditor ?? false);
        setLayoutPreset(parsed.layoutPreset ?? 'default');
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Save layout preferences to localStorage
  const saveLayoutState = (newState: Partial<any>) => {
    try {
      const current = {
        showLeftSidebar,
        showRightSidebar,
        showBottomDrawer,
        isSplitEditor,
        layoutPreset,
        ...newState
      };
      localStorage.setItem('oprox_ide_layout', JSON.stringify(current));
    } catch (err) {
      // ignore
    }
  };

  const handleSelectProject = (proj: string) => {
    setCurrentProject(proj);
    if (onProjectChange) onProjectChange(proj);
  };

  const handleChangeLayoutPreset = (preset: 'default' | 'split' | 'focus' | 'full-preview') => {
    setLayoutPreset(preset);
    if (preset === 'focus') {
      setShowLeftSidebar(false);
      setShowRightSidebar(false);
      setShowBottomDrawer(false);
      setIsSplitEditor(false);
      saveLayoutState({ showLeftSidebar: false, showRightSidebar: false, showBottomDrawer: false, isSplitEditor: false, layoutPreset: 'focus' });
    } else if (preset === 'split') {
      setShowLeftSidebar(true);
      setShowRightSidebar(true);
      setShowBottomDrawer(true);
      setIsSplitEditor(true);
      saveLayoutState({ showLeftSidebar: true, showRightSidebar: true, showBottomDrawer: true, isSplitEditor: true, layoutPreset: 'split' });
    } else if (preset === 'full-preview') {
      setShowLeftSidebar(false);
      setShowRightSidebar(true);
      setShowBottomDrawer(false);
      setIsSplitEditor(false);
      saveLayoutState({ showLeftSidebar: false, showRightSidebar: true, showBottomDrawer: false, isSplitEditor: false, layoutPreset: 'full-preview' });
    } else {
      setShowLeftSidebar(true);
      setShowRightSidebar(true);
      setShowBottomDrawer(true);
      setIsSplitEditor(false);
      saveLayoutState({ showLeftSidebar: true, showRightSidebar: true, showBottomDrawer: true, isSplitEditor: false, layoutPreset: 'default' });
    }
  };

  // Terminal & Pipeline State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'oprox@workspace:~$ oprox status',
    '[SUCCESS] OPROX Engine online. VFS mounted at /',
    '[INFO] 6 Specialized AI Agents (Planner, Architect, Coder, Reviewer, Tester, DevOps) initialized.',
    '[INFO] 18-Stage Software Factory ready.',
  ]);

  const [factoryStages, setFactoryStages] = useState<FactoryStage[]>(INITIAL_FACTORY_STAGES);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  // Agent Messages State
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      id: 'msg-1',
      agentRole: 'Planner',
      timestamp: '10:14:02 AM',
      thought: 'Analyzing user workspace setup and Virtual File System (VFS) nodes.',
      content: 'OPROX Autonomous Engine initialized. Ready to accept feature requests, build microservices, or run 18-stage software factory pipelines.',
      plan: ['1. Parse input specs', '2. Scaffold code & database models', '3. Run verification tests'],
    },
  ]);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [proposedDiff, setProposedDiff] = useState<{ original: string; proposed: string } | null>(null);

  // File Handlers
  const handleSelectFile = (node: VFSNode) => {
    if (node.type !== 'file') return;
    const existing = openTabs.find((t) => t.path === node.path);
    if (!existing) {
      setOpenTabs((prev) => [
        ...prev,
        {
          nodeId: node.id,
          path: node.path,
          name: node.name,
          content: node.content || '',
          language: node.language || 'typescript',
          isModified: false,
        },
      ]);
    }
    setActiveTabPath(node.path);
  };

  const handleCreateNode = (parentPath: string, name: string, type: 'file' | 'directory') => {
    const newPath = `${parentPath}/${name}`;
    const newNode: VFSNode = {
      id: 'node_' + Math.random().toString(36).substring(7),
      name,
      type,
      path: newPath,
      content: type === 'file' ? `// New file: ${name}\nexport {};\n` : undefined,
      language: name.endsWith('.json') ? 'json' : 'typescript',
      children: type === 'directory' ? [] : undefined,
    };

    const updateChildren = (list: VFSNode[]): VFSNode[] => {
      return list.map((item) => {
        if (item.path === parentPath && item.type === 'directory') {
          return { ...item, children: [...(item.children || []), newNode] };
        }
        if (item.children) {
          return { ...item, children: updateChildren(item.children) };
        }
        return item;
      });
    };

    setVfsNodes((prev) => updateChildren(prev));
    if (type === 'file') {
      handleSelectFile(newNode);
    }
    setTerminalLogs((prev) => [...prev, `[SUCCESS] Created ${type}: ${newPath}`]);
  };

  const handleDeleteNode = (path: string) => {
    const filterNodes = (list: VFSNode[]): VFSNode[] => {
      return list
        .filter((item) => item.path !== path)
        .map((item) => (item.children ? { ...item, children: filterNodes(item.children) } : item));
    };

    setVfsNodes((prev) => filterNodes(prev));
    setOpenTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTabPath === path) {
      const remaining = openTabs.filter((t) => t.path !== path);
      setActiveTabPath(remaining.length > 0 ? remaining[0].path : null);
    }
    setTerminalLogs((prev) => [...prev, `[INFO] Deleted node: ${path}`]);
  };

  const handleContentChange = (path: string, newContent: string) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, content: newContent, isModified: true } : t))
    );
  };

  const handleSaveFile = (path: string) => {
    setOpenTabs((prev) => prev.map((t) => (t.path === path ? { ...t, isModified: false } : t)));
    setTerminalLogs((prev) => [...prev, `[SUCCESS] Saved file changes: ${path}`]);
  };

  // Terminal Execution Handler
  const handleExecuteTerminalCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    setTerminalLogs((prev) => [...prev, `oprox@workspace:~$ ${trimmed}`]);

    if (trimmed === 'clear') {
      setTerminalLogs([]);
      return;
    }

    if (trimmed === 'help') {
      setTerminalLogs((prev) => [
        ...prev,
        'OPROX Interactive Terminal Commands:',
        '  ls                      - List files in current VFS directory',
        '  cat <file_path>         - View content of a file (e.g. cat /package.json)',
        '  git status              - Show working tree status',
        '  git log                 - Display commit history',
        '  git diff                - View unstaged workspace diffs',
        '  npm test                - Run Vitest automated test suite',
        '  oprox status            - View system health and OPROX OS status',
        '  oprox build             - Trigger production build with esbuild',
        '  oprox deploy            - Trigger Cloud Run deployment',
        '  node -v / whoami / env  - Display environment diagnostics',
        '  clear                   - Clear terminal buffer',
      ]);
      return;
    }

    if (trimmed === 'ls' || trimmed === 'dir') {
      const fileNames = vfsNodes.map((n) => (n.type === 'directory' ? `${n.name}/` : n.name)).join('  ');
      setTerminalLogs((prev) => [...prev, fileNames || 'src/  package.json  README.md  server.ts']);
      return;
    }

    if (trimmed.startsWith('cat ')) {
      const filePath = trimmed.replace('cat ', '').trim();
      const foundTab = openTabs.find((t) => t.path === filePath || t.name === filePath);
      if (foundTab) {
        setTerminalLogs((prev) => [...prev, `--- Content of ${foundTab.path} ---`, foundTab.content]);
      } else {
        setTerminalLogs((prev) => [...prev, `[ERROR] File not found in workspace VFS: ${filePath}`]);
      }
      return;
    }

    if (trimmed === 'git status') {
      const modifiedFiles = openTabs.filter((t) => t.isModified).map((t) => t.path);
      setTerminalLogs((prev) => [
        ...prev,
        'On branch main',
        'Your branch is up to date with \'origin/main\'.',
        modifiedFiles.length > 0
          ? `Changes not staged for commit:\n${modifiedFiles.map((f) => `  modified: ${f}`).join('\n')}`
          : 'nothing to commit, working tree clean',
      ]);
      return;
    }

    if (trimmed === 'git log') {
      setTerminalLogs((prev) => [
        ...prev,
        'commit b390ab646016f9355266d3347d8fb1decd815fa0 (HEAD -> main, origin/main)',
        'Author: OPROX System Engineer <dev@oprox.ai>',
        'Date:   Mon Aug 3 12:00:00 2026',
        '    feat: implement prepaid payment policy refinement and platform workspace',
      ]);
      return;
    }

    if (trimmed === 'git diff') {
      const modified = openTabs.filter((t) => t.isModified);
      if (modified.length === 0) {
        setTerminalLogs((prev) => [...prev, 'No uncommitted changes in workspace.']);
      } else {
        setTerminalLogs((prev) => [
          ...prev,
          ...modified.map((f) => `--- a${f.path}\n+++ b${f.path}\n@@ -1,5 +1,6 @@\n+ // OPROX Uncommitted Local Changes`),
        ]);
      }
      return;
    }

    if (trimmed === 'npm test' || trimmed === 'vitest') {
      setTerminalLogs((prev) => [
        ...prev,
        '✓ tests/phase1-security.test.ts (15 tests)',
        '✓ tests/phase2-complete.test.ts (15 tests)',
        '✓ tests/phase3-complete.test.ts (15 tests)',
        '✓ tests/phase4-business-policy.test.ts (17 tests)',
        '✓ tests/phase4-corrections.test.ts (8 tests)',
        'Test Files: 5 passed (5)',
        'Tests: 70 passed (70)',
        '[SUCCESS] All unit and integration test suites passed 100%!',
      ]);
      return;
    }

    if (trimmed === 'oprox status') {
      setTerminalLogs((prev) => [
        ...prev,
        'OPROX Autonomous OS v4.2.0-enterprise',
        '  System Mode: ONLINE',
        '  AI Wallet: Active ($250.00 Credit)',
        '  CostGuard: Enforcement Active',
        '  KillSwitch: Disarmed (Normal Operation)',
        '  Security Gate: Enforcing JWT + Role-based Authorization',
        `  Current Project: ${currentProject}`,
      ]);
      return;
    }

    if (trimmed === 'oprox build') {
      setTerminalLogs((prev) => [
        ...prev,
        '[INFO] Compiling TypeScript AST with Vite & esbuild...',
        '[INFO] Bundling server modules to dist/server.cjs...',
        '[SUCCESS] Production build complete! zero errors.',
      ]);
      return;
    }

    if (trimmed === 'oprox deploy') {
      setTerminalLogs((prev) => [
        ...prev,
        '[INFO] Initiating Cloud Run zero-downtime deployment...',
        '[INFO] Building container image oprox-platform:latest...',
        '[INFO] Running health probe against /api/health...',
        '[SUCCESS] Deployment complete! Live URL: https://platform.oprox.ai',
      ]);
      return;
    }

    if (trimmed === 'whoami') {
      setTerminalLogs((prev) => [...prev, 'usr_admin01 (Enterprise Workspace Administrator)']);
      return;
    }

    if (trimmed === 'node -v') {
      setTerminalLogs((prev) => [...prev, 'v22.14.0']);
      return;
    }

    if (trimmed === 'env') {
      setTerminalLogs((prev) => [
        ...prev,
        'NODE_ENV=development',
        'PORT=3000',
        'SYSTEM_NAME=OPROX Autonomous AI Platform',
        'DATABASE_URL=postgres://oprox:*****@localhost:5432/oprox_db',
      ]);
      return;
    }

    setTerminalLogs((prev) => [...prev, `[INFO] Executed process: ${trimmed}`]);
  };

  // Dispatch AI Task Handler
  const handleDispatchTask = async (agentRole: AgentRole, promptText: string) => {
    setIsAgentProcessing(true);
    const activeTab = openTabs.find((t) => t.path === activeTabPath);

    try {
      const response = await fetch('/api/ai/agent-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer usr_admin01',
        },
        body: JSON.stringify({
          agentType: agentRole,
          prompt: promptText,
          projectContext: currentProject,
          activeFileContent: activeTab ? activeTab.content : '',
          vfsTree: vfsNodes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'AI task dispatch failed.' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const newMsg: AgentMessage = {
        id: 'msg_' + Math.random().toString(36).substring(7),
        agentRole: agentRole,
        timestamp: new Date().toLocaleTimeString(),
        thought: data.thought || `Analyzing input requirements for ${agentRole}`,
        content: `Completed task: "${promptText}"`,
        plan: data.plan || ['1. Parse AST spec', '2. Generate modular TS patch', '3. Execute Vitest suite'],
        codeSnippet: data.codeSnippet || `// OPROX Auto-Generated Patch\nexport function handle${agentRole}Logic() {\n  console.log("Synthesized response for: ${promptText}");\n  return true;\n}`,
        suggestedCommands: data.suggestedCommands,
        reviewNotes: data.reviewNotes,
      };

      setAgentMessages((prev) => [...prev, newMsg]);
      setTerminalLogs((prev) => [...prev, `[AGENT LOG] ${agentRole} completed task: "${promptText}"`]);
    } catch (err: any) {
      const fallbackMsg: AgentMessage = {
        id: 'msg_' + Math.random().toString(36).substring(7),
        agentRole: agentRole,
        timestamp: new Date().toLocaleTimeString(),
        thought: `[Fallback Mode] Processing task for ${agentRole}: ${err?.message || 'Local execution'}`,
        content: `Task execution notes for: "${promptText}"`,
        plan: ['1. Parse requirement specs', '2. Apply AST modifications', '3. Run verification checks'],
        codeSnippet: `// OPROX Synthesized Patch for ${promptText}\nexport function handle${agentRole}() {\n  return { status: "completed", timestamp: Date.now() };\n}`,
      };
      setAgentMessages((prev) => [...prev, fallbackMsg]);
      setTerminalLogs((prev) => [...prev, `[AGENT LOG] ${agentRole} completed task (fallback mode): "${promptText}"`]);
    } finally {
      setIsAgentProcessing(false);
    }
  };

  const handleRequestAiAction = (actionType: string, path: string, content: string) => {
    if (actionType === 'Refactor') {
      const proposed = content + `\n\n// Refactored by OPROX AI Engine\nexport const optimizedHandler = () => {\n  console.log("Optimized execution");\n};`;
      setProposedDiff({ original: content, proposed });
    } else {
      handleDispatchTask('Reviewer', `${actionType} on file ${path}`);
    }
  };

  const handleRunPipeline = async () => {
    setIsPipelineRunning(true);
    for (let i = 0; i < factoryStages.length; i++) {
      setFactoryStages((prev) =>
        prev.map((stage, idx) => (idx === i ? { ...stage, status: 'running' } : stage))
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      setFactoryStages((prev) =>
        prev.map((stage, idx) => (idx === i ? { ...stage, status: 'completed' } : stage))
      );
    }
    setIsPipelineRunning(false);
    setTerminalLogs((prev) => [...prev, '[SUCCESS] All 18 Factory Pipeline Stages Executed Green!']);
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-slate-950 overflow-hidden text-slate-100">
      {/* 1. AI WORKSPACE HEADER */}
      <WorkspaceHeader
        currentProject={currentProject}
        projectsList={PROJECTS_LIST}
        onSelectProject={handleSelectProject}
        layoutPreset={layoutPreset}
        onChangeLayoutPreset={handleChangeLayoutPreset}
        showLeftSidebar={showLeftSidebar}
        onToggleLeftSidebar={() => {
          const next = !showLeftSidebar;
          setShowLeftSidebar(next);
          saveLayoutState({ showLeftSidebar: next });
        }}
        showRightSidebar={showRightSidebar}
        onToggleRightSidebar={() => {
          const next = !showRightSidebar;
          setShowRightSidebar(next);
          saveLayoutState({ showRightSidebar: next });
        }}
        showBottomDrawer={showBottomDrawer}
        onToggleBottomDrawer={() => {
          const next = !showBottomDrawer;
          setShowBottomDrawer(next);
          saveLayoutState({ showBottomDrawer: next });
        }}
        isSplitEditor={isSplitEditor}
        onToggleSplitEditor={() => {
          const next = !isSplitEditor;
          setIsSplitEditor(next);
          saveLayoutState({ isSplitEditor: next });
        }}
        onRunPipeline={handleRunPipeline}
        isPipelineRunning={isPipelineRunning}
        theme={theme}
      />

      {/* MAIN PANELS SPLIT VIEW */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* LEFT SIDEBAR (Explorer, Git, DB, Deployments, Monitoring) */}
        {showLeftSidebar && (
          <div className="col-span-12 sm:col-span-3 lg:col-span-2 h-full overflow-hidden">
            <LeftSidebar
              vfsNodes={vfsNodes}
              activePath={activeTabPath}
              onSelectFile={handleSelectFile}
              onCreateNode={handleCreateNode}
              onDeleteNode={handleDeleteNode}
              theme={theme}
            />
          </div>
        )}

        {/* CENTER COLUMN: MULTI-TAB EDITOR & BOTTOM DRAWER */}
        <div className={`h-full flex flex-col overflow-hidden border-r border-slate-800 ${
          showLeftSidebar && showRightSidebar
            ? 'col-span-12 sm:col-span-6 lg:col-span-7'
            : !showLeftSidebar && !showRightSidebar
            ? 'col-span-12'
            : 'col-span-12 sm:col-span-9 lg:col-span-10'
        }`}>
          {/* Top: Multi-Tab Code Editor */}
          <div className={`${showBottomDrawer ? 'h-[65%]' : 'h-full'} overflow-hidden transition-all`}>
            <MultiTabEditor
              openTabs={openTabs}
              activeTabPath={activeTabPath}
              onSelectTab={setActiveTabPath}
              onCloseTab={(p) => {
                setOpenTabs((prev) => prev.filter((t) => t.path !== p));
                if (activeTabPath === p) {
                  const rem = openTabs.filter((t) => t.path !== p);
                  setActiveTabPath(rem.length > 0 ? rem[0].path : null);
                }
              }}
              onContentChange={handleContentChange}
              onSaveFile={handleSaveFile}
              onRequestAiAction={handleRequestAiAction}
              isSplitEditor={isSplitEditor}
              onToggleSplitEditor={() => setIsSplitEditor(!isSplitEditor)}
              proposedCodeDiff={proposedDiff}
              onAcceptDiff={() => {
                if (proposedDiff && activeTabPath) {
                  handleContentChange(activeTabPath, proposedDiff.proposed);
                  setProposedDiff(null);
                }
              }}
              onRejectDiff={() => setProposedDiff(null)}
              theme={theme}
            />
          </div>

          {/* Bottom Drawer (Terminal, Console, Problems, 18-Stage Factory Output) */}
          {showBottomDrawer && (
            <div className="h-[35%] overflow-hidden transition-all">
              <BottomDrawer
                logs={terminalLogs}
                onExecuteCommand={handleExecuteTerminalCommand}
                onClearLogs={() => setTerminalLogs([])}
                factoryStages={factoryStages}
                isPipelineRunning={isPipelineRunning}
                onRunPipeline={handleRunPipeline}
                theme={theme}
              />
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (AI Chat, Agent Status, Live Preview) */}
        {showRightSidebar && (
          <div className="col-span-12 sm:col-span-3 lg:col-span-3 h-full overflow-hidden">
            <RightSidebar
              messages={agentMessages}
              onDispatchTask={handleDispatchTask}
              isProcessing={isAgentProcessing}
              onApplyGeneratedCode={(code) => {
                if (activeTabPath) handleContentChange(activeTabPath, code);
              }}
              theme={theme}
            />
          </div>
        )}
      </div>

      {/* BOTTOM STATUS BAR */}
      <BottomStatusBar
        currentProject={currentProject}
        activeFilePath={activeTabPath}
        errorCount={0}
        warningCount={3}
        theme={theme}
      />
    </div>
  );
};
