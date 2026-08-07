import React, { useState, useEffect } from 'react';
import {
  Layers,
  Palette,
  Database,
  GitBranch,
  Play,
  Save,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Trash2,
  Code,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Zap,
  Cloud,
  FolderPlus,
  FileText,
  Copy,
  Archive,
  Image,
  Send,
  HelpCircle,
  Check,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Eye,
  Settings,
  Lock,
  Unlock,
  CornerDownRight,
  Split,
  Tag,
  Upload,
} from 'lucide-react';
import {
  StudioIr,
  StudioNode,
  StudioComponentType,
  createDefaultStudioIr,
  validateStudioIr,
} from '../../lib/studio/studioIr';
import { compileStudioIr } from '../../lib/studio/studioCompiler';
import { generateDrizzleSchemaCode } from '../../lib/studio/studioDrizzleGenerator';
import { simulateFlowExecution } from '../../lib/studio/studioFlowEngine';
import {
  generateFullStackBundle,
  exportStudioToWorkspace,
  deployStudioApp,
  rollbackStudioDeployment,
  publishStudioAppDomain,
  DeploymentRecord,
} from '../../lib/studio/studioPhase3Engine';
import {
  StudioAiPlan,
  GenerationStage,
  GenerationProgress,
  StudioUnifiedIssue,
  createStudioAiPlan,
  executeStudioAiGeneration,
  aggregateStudioProjectIssues,
} from '../../lib/studio/studioPhase5Engine';

type WorkspaceJob =
  | 'PROJECT'
  | 'DESIGN'
  | 'PAGES'
  | 'COMPONENTS'
  | 'DATA'
  | 'LOGIC'
  | 'ASSETS'
  | 'PREVIEW'
  | 'PUBLISH';

type ViewportSize = 'DESKTOP' | 'TABLET' | 'MOBILE';
type SaveStatus = 'DIRTY' | 'SAVING' | 'SAVED' | 'FAILED' | 'CONFLICT';

interface StudioProjectSummary {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  status: string;
}

export const StudioAppSuite: React.FC = () => {
  const [activeJob, setActiveJob] = useState<WorkspaceJob>('PROJECT');
  const [viewport, setViewport] = useState<ViewportSize>('DESKTOP');

  // Tenant Projects State
  const [projectsList, setProjectsList] = useState<StudioProjectSummary[]>([
    {
      id: 'proj_studio_demo',
      name: 'Property Management Portal',
      description: 'AI generated dashboard for rental properties & tenants',
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE',
    },
  ]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('proj_studio_demo');
  const [projectName, setProjectName] = useState<string>('Property Management Portal');

  // Studio IR & Selection State
  const [studioIr, setStudioIr] = useState<StudioIr>(() =>
    createDefaultStudioIr('proj_studio_demo', 'tenant_demo', 'Property Management Portal')
  );
  const [activePageId, setActivePageId] = useState<string>('page_home');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node_hero_section');

  // Revisions & OCC
  const [activeRevisionNumber, setActiveRevisionNumber] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('SAVED');

  // Creation Wizard Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createMode, setCreateMode] = useState<'AI' | 'BLANK' | 'TEMPLATE'>('AI');
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [aiPromptInput, setAiPromptInput] = useState<string>('Create a property management dashboard with login, properties, tenants, and maintenance requests');
  const [currentAiPlan, setCurrentAiPlan] = useState<StudioAiPlan | null>(null);
  const [generationStage, setGenerationStage] = useState<GenerationStage | null>(null);

  // AI Copilot Drawer & Proposals
  const [showCopilotDrawer, setShowCopilotDrawer] = useState<boolean>(false);
  const [copilotPrompt, setCopilotPrompt] = useState<string>('');
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [copilotProposal, setCopilotProposal] = useState<any | null>(null);

  // Error Center Drawer
  const [showErrorCenter, setShowErrorCenter] = useState<boolean>(false);
  const [aggregatedIssues, setAggregatedIssues] = useState<StudioUnifiedIssue[]>([]);

  // Deployment & Publishing
  const [deployEnv, setDeployEnv] = useState<'staging' | 'production'>('staging');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploymentsList, setDeploymentsList] = useState<DeploymentRecord[]>([]);
  const [customDomainInput, setCustomDomainInput] = useState<string>('');
  const [publishedDomainResult, setPublishedDomainResult] = useState<string | null>(null);
  const [deploymentNotice, setDeploymentNotice] = useState<string | null>(null);

  // Autosave simulation
  useEffect(() => {
    setSaveStatus('DIRTY');
    const timer = setTimeout(() => {
      setSaveStatus('SAVING');
      setTimeout(() => {
        setSaveStatus('SAVED');
      }, 250);
    }, 800);
    return () => clearTimeout(timer);
  }, [studioIr]);

  // Aggregate issues whenever IR changes
  useEffect(() => {
    setAggregatedIssues(aggregateStudioProjectIssues(studioIr));
  }, [studioIr]);

  // Load Projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/studio/projects', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.projects) && data.projects.length > 0) {
          setProjectsList(
            data.projects.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              updatedAt: p.updatedAt || new Date().toISOString(),
              status: p.status || 'ACTIVE',
            }))
          );
        }
      } catch (e) {
        // Fallback to default
      }
    }
    fetchProjects();
  }, []);

  // Helper: Get active page node
  const activePage = studioIr.pages.find((p) => p.id === activePageId) || studioIr.pages[0];

  // Helper: Find Node Recursively
  function findNodeById(node: StudioNode, id: string): StudioNode | null {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  const selectedNode = selectedNodeId ? findNodeById(activePage.rootNode, selectedNodeId) : null;

  // Helper: Update Node Property
  function updateSelectedNode(mutator: (n: StudioNode) => void) {
    if (!selectedNodeId) return;
    const newIr: StudioIr = JSON.parse(JSON.stringify(studioIr));
    const targetPage = newIr.pages.find((p) => p.id === activePageId) || newIr.pages[0];

    function traverse(node: StudioNode): boolean {
      if (node.id === selectedNodeId) {
        mutator(node);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (traverse(child)) return true;
        }
      }
      return false;
    }

    traverse(targetPage.rootNode);
    setStudioIr(newIr);
  }

  // Insert Component onto Canvas
  function handleInsertComponent(type: StudioComponentType) {
    const parentId = selectedNodeId || activePage.rootNode.id;
    const newNodeId = `node_${type.toLowerCase()}_${Date.now().toString(36).substring(4)}`;

    const newNode: StudioNode = {
      id: newNodeId,
      type,
      name: `${type} Element`,
      props:
        type === 'Heading'
          ? { content: 'New Heading', level: 'h2' }
          : type === 'Button'
          ? { label: 'Action Button', variant: 'primary' }
          : type === 'Text'
          ? { content: 'Sample text paragraph for your layout.' }
          : {},
      style:
        type === 'Container' || type === 'Card'
          ? { padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }
          : type === 'Button'
          ? { backgroundColor: '#3b82f6', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '0.375rem' }
          : { color: '#0f172a' },
    };

    const newIr: StudioIr = JSON.parse(JSON.stringify(studioIr));
    const targetPage = newIr.pages.find((p) => p.id === activePageId) || newIr.pages[0];

    function addParent(node: StudioNode): boolean {
      if (node.id === parentId) {
        if (!node.children) node.children = [];
        node.children.push(newNode);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (addParent(child)) return true;
        }
      }
      return false;
    }

    addParent(targetPage.rootNode);
    setStudioIr(newIr);
    setSelectedNodeId(newNodeId);
  }

  // Delete Selected Node
  function handleDeleteNode(nodeId: string) {
    if (nodeId.startsWith('node_root_')) return;
    const newIr: StudioIr = JSON.parse(JSON.stringify(studioIr));
    const targetPage = newIr.pages.find((p) => p.id === activePageId) || newIr.pages[0];

    function removeNode(parent: StudioNode): boolean {
      if (!parent.children) return false;
      const idx = parent.children.findIndex((c) => c.id === nodeId);
      if (idx !== -1) {
        parent.children.splice(idx, 1);
        return true;
      }
      for (const child of parent.children) {
        if (removeNode(child)) return true;
      }
      return false;
    }

    removeNode(targetPage.rootNode);
    setStudioIr(newIr);
    setSelectedNodeId(targetPage.rootNode.id);
  }

  // Project Management Actions
  async function handleOpenProject(pId: string) {
    try {
      const res = await fetch(`/api/studio/projects/${pId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      const data = await res.json();
      if (data.success && data.ir) {
        setStudioIr(data.ir);
        setCurrentProjectId(pId);
        setProjectName(data.meta?.name || data.ir.project?.name || 'Studio Project');
        setActivePageId(data.ir.pages[0]?.id || 'page_home');
        setSelectedNodeId(data.ir.pages[0]?.rootNode.id || null);
        setActiveJob('DESIGN');
      }
    } catch (e) {
      setCurrentProjectId(pId);
      setActiveJob('DESIGN');
    }
  }

  async function handleCreateBlankProject() {
    const name = newProjectName.trim() || 'New Studio App';
    try {
      const res = await fetch('/api/studio/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ name, description: 'Blank Studio Project' }),
      });
      const data = await res.json();
      if (data.success && data.project) {
        const freshIr = createDefaultStudioIr(data.project.id, 'tenant_demo', name);
        setStudioIr(freshIr);
        setCurrentProjectId(data.project.id);
        setProjectName(name);
        setProjectsList((prev) => [
          {
            id: data.project.id,
            name,
            description: 'Blank Studio Project',
            updatedAt: new Date().toISOString(),
            status: 'ACTIVE',
          },
          ...prev,
        ]);
        setShowCreateModal(false);
        setActiveJob('DESIGN');
      }
    } catch (e) {
      setShowCreateModal(false);
    }
  }

  async function handlePlanWithAi() {
    if (!aiPromptInput.trim()) return;
    setGenerationStage('PLANNING');
    try {
      const res = await fetch('/api/studio/projects/ai-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ prompt: aiPromptInput }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setCurrentAiPlan(data.plan);
        setGenerationStage('READY');
      } else {
        const localPlan = createStudioAiPlan(aiPromptInput);
        setCurrentAiPlan(localPlan);
        setGenerationStage('READY');
      }
    } catch (e) {
      const localPlan = createStudioAiPlan(aiPromptInput);
      setCurrentAiPlan(localPlan);
      setGenerationStage('READY');
    }
  }

  async function handleGenerateFromAiPlan() {
    const name = newProjectName.trim() || (currentAiPlan ? currentAiPlan.applicationType : 'AI Application');
    setGenerationStage('GENERATING_STRUCTURE');

    try {
      const res = await fetch('/api/studio/projects/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ name, prompt: aiPromptInput, plan: currentAiPlan }),
      });
      const data = await res.json();
      if (data.success && data.ir) {
        setStudioIr(data.ir);
        setCurrentProjectId(data.project.id);
        setProjectName(name);
        setProjectsList((prev) => [
          {
            id: data.project.id,
            name,
            description: `AI Generated: ${aiPromptInput.substring(0, 40)}`,
            updatedAt: new Date().toISOString(),
            status: 'ACTIVE',
          },
          ...prev,
        ]);
        setShowCreateModal(false);
        setActiveJob('DESIGN');
      } else {
        const progress = await executeStudioAiGeneration(
          `proj_${Date.now()}`,
          'tenant_demo',
          name,
          aiPromptInput
        );
        if (progress.resultIr) {
          setStudioIr(progress.resultIr);
          setCurrentProjectId(progress.resultIr.project.id);
          setProjectName(name);
          setShowCreateModal(false);
          setActiveJob('DESIGN');
        }
      }
    } catch (e) {
      const progress = await executeStudioAiGeneration(
        `proj_${Date.now()}`,
        'tenant_demo',
        name,
        aiPromptInput
      );
      if (progress.resultIr) {
        setStudioIr(progress.resultIr);
        setCurrentProjectId(progress.resultIr.project.id);
        setProjectName(name);
        setShowCreateModal(false);
        setActiveJob('DESIGN');
      }
    } finally {
      setGenerationStage(null);
    }
  }

  async function handleDuplicateProject(pId: string) {
    try {
      const res = await fetch(`/api/studio/projects/${pId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      const data = await res.json();
      if (data.success && data.project) {
        setProjectsList((prev) => [
          {
            id: data.project.id,
            name: data.project.name,
            description: 'Duplicated project',
            updatedAt: new Date().toISOString(),
            status: 'ACTIVE',
          },
          ...prev,
        ]);
      }
    } catch (e) {
      // Local fallback
    }
  }

  // Copilot Proposal Generation
  async function handleRunCopilotProposal() {
    if (!copilotPrompt.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await fetch(`/api/studio/projects/${currentProjectId}/copilot/propose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          prompt: copilotPrompt,
          selectedScopeId: selectedNodeId,
        }),
      });
      const data = await res.json();
      if (data.success && data.changeset) {
        setCopilotProposal(data.changeset);
      } else {
        setCopilotProposal({
          summary: `Proposed AI modification for: "${copilotPrompt}"`,
          pagesAffected: [activePage.name],
          nodesAdded: 1,
          nodesRemoved: 0,
        });
      }
    } catch (e: any) {
      setCopilotProposal({
        summary: `Local AI proposal generated for: "${copilotPrompt}"`,
        pagesAffected: [activePage.name],
        nodesAdded: 1,
        nodesRemoved: 0,
      });
    } finally {
      setCopilotLoading(false);
    }
  }

  // Apply Copilot Proposal
  function handleApplyCopilotProposal() {
    if (!copilotProposal) return;
    handleInsertComponent('Card');
    setCopilotProposal(null);
    setCopilotPrompt('');
  }

  // Deploy & Publish Actions
  async function handleTriggerDeployment() {
    setIsDeploying(true);
    try {
      const record = await deployStudioApp(
        currentProjectId,
        'tenant_demo',
        `rev_${activeRevisionNumber}`,
        deployEnv,
        'usr_author_1',
        studioIr
      );
      setDeploymentsList((prev) => [record, ...prev]);
      setDeploymentNotice(`Successfully deployed to ${record.environment.toUpperCase()} at ${record.publicUrl}`);
    } catch (e: any) {
      setDeploymentNotice(`Deployment failed: ${e.message}`);
    } finally {
      setIsDeploying(false);
    }
  }

  async function handlePublishDomain(depId: string) {
    if (!customDomainInput) return;
    try {
      const dom = await publishStudioAppDomain(currentProjectId, 'tenant_demo', depId, customDomainInput);
      setPublishedDomainResult(`Bound custom domain https://${dom.domainName} (SSL Active)`);
    } catch (e: any) {
      setDeploymentNotice(`Domain publishing failed: ${e.message}`);
    }
  }

  // Render Canvas Recursive Node
  function renderCanvasNode(node: StudioNode) {
    const isSelected = selectedNodeId === node.id;
    const borderStyle = isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 shadow-md' : 'hover:border-blue-300/50';

    switch (node.type) {
      case 'Heading': {
        const text = node.props.content || node.props.text || node.name;
        return (
          <h1
            key={node.id}
            id={node.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            className={`cursor-pointer transition-all ${borderStyle}`}
            style={node.style}
          >
            {text}
          </h1>
        );
      }
      case 'Text': {
        const text = node.props.content || node.props.text || node.name;
        return (
          <p
            key={node.id}
            id={node.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            className={`cursor-pointer transition-all ${borderStyle}`}
            style={node.style}
          >
            {text}
          </p>
        );
      }
      case 'Button': {
        const label = node.props.label || 'Button';
        return (
          <button
            key={node.id}
            id={node.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            className={`cursor-pointer transition-all ${borderStyle}`}
            style={node.style}
          >
            {label}
          </button>
        );
      }
      case 'Container':
      case 'Section':
      case 'Card':
      default: {
        return (
          <div
            key={node.id}
            id={node.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(node.id);
            }}
            className={`cursor-pointer transition-all min-h-[50px] ${borderStyle}`}
            style={node.style}
          >
            {(node.children || []).map((c) => renderCanvasNode(c))}
          </div>
        );
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden" id="oprox_studio_app">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            S
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{projectName}</span>
            </h1>
            <p className="text-xs text-slate-400">OPROX Studio — Visual Application Builder</p>
          </div>
        </div>

        {/* Product Navigation Jobs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 space-x-1">
          <button
            id="nav_job_project"
            onClick={() => setActiveJob('PROJECT')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'PROJECT' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" /> Project
          </button>
          <button
            id="nav_job_design"
            onClick={() => setActiveJob('DESIGN')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'DESIGN' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> Design
          </button>
          <button
            id="nav_job_pages"
            onClick={() => setActiveJob('PAGES')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'PAGES' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Pages
          </button>
          <button
            id="nav_job_components"
            onClick={() => setActiveJob('COMPONENTS')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'COMPONENTS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Components
          </button>
          <button
            id="nav_job_data"
            onClick={() => setActiveJob('DATA')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'DATA' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Data
          </button>
          <button
            id="nav_job_logic"
            onClick={() => setActiveJob('LOGIC')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'LOGIC' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Logic
          </button>
          <button
            id="nav_job_assets"
            onClick={() => setActiveJob('ASSETS')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'ASSETS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-3.5 h-3.5" /> Assets
          </button>
          <button
            id="nav_job_preview"
            onClick={() => setActiveJob('PREVIEW')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'PREVIEW' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            id="nav_job_publish"
            onClick={() => setActiveJob('PUBLISH')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeJob === 'PUBLISH' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" /> Publish
          </button>
        </div>

        {/* Viewport Controls & Status Tools */}
        <div className="flex items-center space-x-3">
          {activeJob === 'DESIGN' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 space-x-1">
              <button
                onClick={() => setViewport('DESKTOP')}
                className={`p-1.5 rounded text-xs ${viewport === 'DESKTOP' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
                title="Desktop Viewport"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('TABLET')}
                className={`p-1.5 rounded text-xs ${viewport === 'TABLET' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
                title="Tablet Viewport"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('MOBILE')}
                className={`p-1.5 rounded text-xs ${viewport === 'MOBILE' ? 'bg-slate-800 text-blue-400' : 'text-slate-500'}`}
                title="Mobile Viewport"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Issue Center Button */}
          <button
            id="btn_error_center"
            onClick={() => setShowErrorCenter(!showErrorCenter)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 border transition-all ${
              aggregatedIssues.some((i) => i.severity === 'ERROR')
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Issues ({aggregatedIssues.length})</span>
          </button>

          {/* Studio AI Copilot Button */}
          <button
            id="btn_studio_ai"
            onClick={() => setShowCopilotDrawer(!showCopilotDrawer)}
            className="px-3 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow flex items-center gap-1.5 hover:from-blue-500 hover:to-indigo-500 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> Studio AI
          </button>

          {/* Save Status */}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              saveStatus === 'SAVED'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {saveStatus}
          </span>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 flex overflow-hidden">
        {/* JOB 1: PROJECT HOME & MANAGEMENT */}
        {activeJob === 'PROJECT' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900" id="view_project_home">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Studio Projects</h2>
                  <p className="text-sm text-slate-400">Manage tenant-owned low-code Studio applications</p>
                </div>
                <button
                  id="btn_create_project_trigger"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" /> Create Studio Project
                </button>
              </div>

              {projectsList.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-slate-800 rounded-xl text-center space-y-4">
                  <FolderPlus className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-base font-semibold text-slate-300">No Studio Projects Found</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Get started by creating a new Studio project with AI generation or starting from a blank layout.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
                  >
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectsList.map((p) => (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border bg-slate-950/80 hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-3 ${
                        currentProjectId === p.id ? 'border-blue-500' : 'border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-100 text-base">{p.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{p.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description || 'Studio Application'}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                        <span>Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDuplicateProject(p.id)}
                            className="p-1 hover:text-slate-200"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenProject(p.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-500 flex items-center gap-1"
                          >
                            Open <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* JOB 2: DESIGN WORKSPACE & VISUAL CANVAS */}
        {activeJob === 'DESIGN' && (
          <div className="flex-1 flex overflow-hidden" id="view_design_workspace">
            {/* Left Panel: Layers & Palette */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/80 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Pages & Palette</h3>
              </div>

              {/* Pages List */}
              <div className="p-3 border-b border-slate-800 space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Pages</span>
                  <button onClick={() => setActiveJob('PAGES')} className="text-xs text-blue-400 hover:underline">
                    Manage
                  </button>
                </div>
                {studioIr.pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePageId(p.id);
                      setSelectedNodeId(p.rootNode.id);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium flex items-center justify-between ${
                      activePageId === p.id ? 'bg-blue-600/20 text-blue-300 border border-blue-800' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-500">{p.path}</span>
                  </button>
                ))}
              </div>

              {/* Component Palette */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                <span className="text-xs font-semibold text-slate-300">Component Palette</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleInsertComponent('Container')}
                    className="p-2 border border-slate-800 bg-slate-950 rounded hover:border-blue-500 text-left text-xs font-medium text-slate-300 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" /> Container
                  </button>
                  <button
                    onClick={() => handleInsertComponent('Heading')}
                    className="p-2 border border-slate-800 bg-slate-950 rounded hover:border-blue-500 text-left text-xs font-medium text-slate-300 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Heading
                  </button>
                  <button
                    onClick={() => handleInsertComponent('Text')}
                    className="p-2 border border-slate-800 bg-slate-950 rounded hover:border-blue-500 text-left text-xs font-medium text-slate-300 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Text
                  </button>
                  <button
                    onClick={() => handleInsertComponent('Button')}
                    className="p-2 border border-slate-800 bg-slate-950 rounded hover:border-blue-500 text-left text-xs font-medium text-slate-300 flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Button
                  </button>
                  <button
                    onClick={() => handleInsertComponent('Card')}
                    className="p-2 border border-slate-800 bg-slate-950 rounded hover:border-blue-500 text-left text-xs font-medium text-slate-300 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" /> Card
                  </button>
                </div>
              </div>
            </aside>

            {/* Center Canvas */}
            <section className="flex-1 bg-slate-900 p-6 overflow-auto flex justify-center items-start">
              <div
                className={`transition-all bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden min-h-[600px] border border-slate-300 p-6 ${
                  viewport === 'DESKTOP' ? 'w-full max-w-5xl' : viewport === 'TABLET' ? 'w-[768px]' : 'w-[375px]'
                }`}
                id="visual_canvas_container"
              >
                {renderCanvasNode(activePage.rootNode)}
              </div>
            </section>

            {/* Right Panel: Property Inspector */}
            <aside className="w-72 border-l border-slate-800 bg-slate-900/80 p-4 overflow-y-auto shrink-0 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Property Inspector</h3>

              {selectedNode ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Element Name</label>
                    <input
                      type="text"
                      value={selectedNode.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSelectedNode((n) => {
                          n.name = val;
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                    />
                  </div>

                  {selectedNode.type === 'Text' || selectedNode.type === 'Heading' ? (
                    <div>
                      <label className="block text-slate-400 mb-1">Text Content</label>
                      <input
                        type="text"
                        value={selectedNode.props.content || selectedNode.props.text || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSelectedNode((n) => {
                            n.props.content = val;
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                      />
                    </div>
                  ) : null}

                  {selectedNode.type === 'Button' ? (
                    <div>
                      <label className="block text-slate-400 mb-1">Button Label</label>
                      <input
                        type="text"
                        value={selectedNode.props.label || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSelectedNode((n) => {
                            n.props.label = val;
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="block text-slate-400 mb-1">Background Color</label>
                    <input
                      type="text"
                      value={selectedNode.style.backgroundColor || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSelectedNode((n) => {
                          n.style.backgroundColor = val;
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Padding</label>
                    <input
                      type="text"
                      value={selectedNode.style.padding || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSelectedNode((n) => {
                          n.style.padding = val;
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="px-3 py-1.5 bg-rose-950/80 text-rose-300 border border-rose-800 rounded hover:bg-rose-900 w-full flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Element
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select an element on canvas to edit properties.</p>
              )}
            </aside>
          </div>
        )}

        {/* JOB 3: PAGES WORKFLOW */}
        {activeJob === 'PAGES' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900" id="view_pages_workflow">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Page Management</h2>
                  <p className="text-sm text-slate-400">Configure application routing hierarchy and page views</p>
                </div>
                <button
                  onClick={() => {
                    const newIr = JSON.parse(JSON.stringify(studioIr));
                    const newPageId = `page_${Date.now().toString(36).substring(4)}`;
                    newIr.pages.push({
                      id: newPageId,
                      name: 'New Page',
                      path: `/page-${newIr.pages.length + 1}`,
                      rootNode: {
                        id: `node_root_${newPageId}`,
                        name: 'Root Container',
                        type: 'Container',
                        props: {},
                        style: { padding: '2rem' },
                        children: [],
                      },
                    });
                    setStudioIr(newIr);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Page
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800">
                {studioIr.pages.map((p, idx) => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{p.name}</span>
                        {idx === 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">HOME</span>}
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{p.path}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setActivePageId(p.id);
                          setActiveJob('DESIGN');
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded"
                      >
                        Edit Canvas
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* JOB 4: COMPONENTS */}
        {activeJob === 'COMPONENTS' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900" id="view_components_library">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Reusable Components</h2>
                <p className="text-sm text-slate-400">Manage master component definitions and symbols</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl space-y-2">
                  <h3 className="font-semibold text-slate-200 text-sm">Header Navigation Bar</h3>
                  <p className="text-xs text-slate-400">Master header component with brand logo and route links</p>
                  <span className="inline-block text-[10px] px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">MASTER SYMBOL</span>
                </div>
                <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl space-y-2">
                  <h3 className="font-semibold text-slate-200 text-sm">Property Record Card</h3>
                  <p className="text-xs text-slate-400">Reusable card layout for rental property listings</p>
                  <span className="inline-block text-[10px] px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">MASTER SYMBOL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JOB 5: DATA / DATABASE ENGINE */}
        {activeJob === 'DATA' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900" id="view_data_schema">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Database Schema & Data Models</h2>
                <p className="text-sm text-slate-400">Define visual entities, fields, relationships, and generate Drizzle ORM code</p>
              </div>

              <div className="space-y-4">
                {studioIr.schema.tables.map((t) => (
                  <div key={t.name} className="p-4 border border-slate-800 bg-slate-950 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-200">{t.name}</h3>
                      <span className="text-xs text-slate-500 font-mono">{t.name}</span>
                    </div>

                    <div className="divide-y divide-slate-800/60 text-xs">
                      {t.columns.map((col) => (
                        <div key={col.name} className="py-2 flex items-center justify-between text-slate-300">
                          <span>{col.name}</span>
                          <span className="font-mono text-slate-400">{col.type} {col.isPrimaryKey ? '(PK)' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* JOB 6: LOGIC / FLOWS */}
        {activeJob === 'LOGIC' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900" id="view_logic_flows">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Logic & Workflow Graph</h2>
                <p className="text-sm text-slate-400">Configure visual event handlers, navigation, and API integration flows</p>
              </div>

              <div className="p-6 border border-slate-800 bg-slate-950 rounded-xl text-center space-y-3">
                <GitBranch className="w-10 h-10 text-blue-500 mx-auto" />
                <h3 className="text-base font-semibold text-slate-200">Active Workflows</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {studioIr.flows.nodes.length} workflow node(s) configured. Simulated flow execution status is READY.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* JOB 7: ASSETS */}
        {activeJob === 'ASSETS' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900" id="view_assets">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Asset Browser</h2>
                  <p className="text-sm text-slate-400">Manage images, media assets, and storage references</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Asset
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border border-slate-800 bg-slate-950 rounded-xl flex items-center gap-3">
                  <Image className="w-8 h-8 text-slate-500" />
                  <div>
                    <span className="font-semibold text-slate-200 text-xs block">logo.png</span>
                    <span className="text-[10px] text-slate-500">12 KB • 1 Usage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JOB 8: PREVIEW */}
        {activeJob === 'PREVIEW' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900 flex justify-center items-start" id="view_preview">
            <div className="w-full max-w-5xl bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden min-h-[650px] p-6 border border-slate-300">
              <div className="pb-4 mb-4 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Interactive Preview Mode</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">READY</span>
              </div>
              {renderCanvasNode(activePage.rootNode)}
            </div>
          </div>
        )}

        {/* JOB 9: PUBLISH & HANDOFF */}
        {activeJob === 'PUBLISH' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900" id="view_publish_handoff">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Publish & Governed Promotion</h2>
                <p className="text-sm text-slate-400">Deploy application to Cloud environments or hand off to OPROX Code / AI</p>
              </div>

              {deploymentNotice && (
                <div className="p-3 bg-blue-950/80 border border-blue-800 text-blue-200 text-xs rounded-lg">
                  {deploymentNotice}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 border border-slate-800 bg-slate-950 rounded-xl space-y-4">
                  <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-400" /> Cloud Deployment
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Target Environment</label>
                      <select
                        value={deployEnv}
                        onChange={(e) => setDeployEnv(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200"
                      >
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                    <button
                      id="btn_trigger_deploy"
                      onClick={handleTriggerDeployment}
                      disabled={isDeploying}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow"
                    >
                      {isDeploying ? 'Deploying...' : `Deploy to ${deployEnv.toUpperCase()}`}
                    </button>
                  </div>
                </div>

                <div className="p-5 border border-slate-800 bg-slate-950 rounded-xl space-y-4">
                  <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
                    <Code className="w-5 h-5 text-indigo-400" /> Governed Handoff
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hand off Studio IR to OPROX Code / AI workspace with automated security scanning and change requests.
                  </p>
                  <button
                    onClick={() => {
                      exportStudioToWorkspace(studioIr, 'usr_author_1');
                      setDeploymentNotice('Handoff complete: Exported to OPROX Code / AI workspace.');
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded shadow"
                  >
                    Open in OPROX Code / AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">Create Studio Project</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creation Mode Switcher */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setCreateMode('AI')}
                className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${
                  createMode === 'AI' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Start with AI
              </button>
              <button
                onClick={() => setCreateMode('BLANK')}
                className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${
                  createMode === 'BLANK' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Blank Project
              </button>
              <button
                onClick={() => setCreateMode('TEMPLATE')}
                className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 ${
                  createMode === 'TEMPLATE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" /> Template
              </button>
            </div>

            {createMode === 'AI' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Project Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Property Management Portal"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Describe your application concept</label>
                  <textarea
                    rows={3}
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                  />
                </div>

                {currentAiPlan && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <span className="font-semibold text-blue-400 block">AI Plan Proposal: {currentAiPlan.applicationType}</span>
                    <p className="text-slate-400 text-[11px]">{currentAiPlan.suggestedPages.length} pages, {currentAiPlan.dataEntities.length} data entities</p>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2">
                  {!currentAiPlan ? (
                    <button
                      onClick={handlePlanWithAi}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                    >
                      Plan Application
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateFromAiPlan}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" /> Generate Studio App
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Project Name</label>
                  <input
                    type="text"
                    placeholder="My Low-Code App"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200"
                  />
                </div>
                <button
                  onClick={handleCreateBlankProject}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDIO AI COPILOT DRAWER */}
      {showCopilotDrawer && (
        <aside className="fixed right-0 top-14 bottom-0 w-80 bg-slate-900 border-l border-slate-800 p-4 shadow-2xl z-40 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Studio AI Assistant
            </h3>
            <button onClick={() => setShowCopilotDrawer(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
              <span className="font-semibold text-slate-300 block">Scope Context</span>
              <p className="text-slate-400 text-[11px]">
                Targeting active page: <span className="text-blue-400">{activePage.name}</span>
              </p>
            </div>

            {copilotProposal && (
              <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-lg space-y-2">
                <span className="font-bold text-blue-300 block">Proposed AI Changeset</span>
                <p className="text-slate-300 text-[11px]">{copilotProposal.summary}</p>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={handleApplyCopilotProposal}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setCopilotProposal(null)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <textarea
              rows={2}
              placeholder="e.g. Add a tenant form to this page..."
              value={copilotPrompt}
              onChange={(e) => setCopilotPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
            />
            <button
              onClick={handleRunCopilotProposal}
              disabled={copilotLoading}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg"
            >
              {copilotLoading ? 'Generating proposal...' : 'Generate AI Proposal'}
            </button>
          </div>
        </aside>
      )}

      {/* ERROR CENTER DRAWER */}
      {showErrorCenter && (
        <aside className="fixed left-0 top-14 bottom-0 w-80 bg-slate-900 border-r border-slate-800 p-4 shadow-2xl z-40 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Studio Error Center
            </h3>
            <button onClick={() => setShowErrorCenter(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 text-xs">
            {aggregatedIssues.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No Studio issues or accessibility warnings found.</p>
            ) : (
              aggregatedIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    issue.severity === 'ERROR'
                      ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                      : 'bg-amber-950/40 border-amber-800 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px]">{issue.category}</span>
                    <span className="text-[10px]">{issue.severity}</span>
                  </div>
                  <p>{issue.message}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
