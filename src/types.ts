// Global OPROX Types

export type AppMode = 'dashboard' | 'oprox-code-ai' | 'studio' | 'real-estate' | 'academy' | 'solutions' | 'platform-suite' | 'ai-os' | 'ide' | 'design-system' | 'showcase' | 'database' | 'cloud' | 'enterprise' | 'media' | 'proptech';

export type SolutionCategory = 'Media & Content' | 'Real Estate & PropTech' | 'Property Management' | 'Enterprise ERP' | 'FinTech & Billing' | 'AI & Automation' | 'Developer Tools';

export interface IndustrySolution {
  id: string;
  name: string;
  tagline: string;
  category: SolutionCategory;
  description: string;
  iconName: string;
  version: string;
  rating: number;
  installCount: number;
  isFeatured: boolean;
  isInstalled: boolean;
  activeUsers: number;
  monthlySavings: string;
  status: 'Active' | 'Updating' | 'Installed' | 'Available';
  tags: string[];
  bannerGradient: string;
}

export interface SolutionActivityLog {
  id: string;
  solutionId: string;
  action: string;
  user: string;
  timestamp: string;
  status: 'success' | 'info' | 'warning';
}

export interface SolutionPermission {
  id: string;
  role: 'Admin' | 'Developer' | 'Manager' | 'Viewer';
  permissions: string[];
}

export interface BillingSummary {
  planName: string;
  monthlyQuotaTokens: string;
  usedTokensPercent: number;
  storageUsedGB: number;
  storageMaxGB: number;
  activeSeats: number;
  maxSeats: number;
  nextBillingDate: string;
  estimatedCost: string;
}

export type AgentRole = 'Planner' | 'Architect' | 'Coder' | 'Reviewer' | 'Tester' | 'DevOps';

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Scaffolding' | 'Refactoring' | 'Security' | 'Optimization' | 'Testing';
  description: string;
  templateText: string;
  variables: string[];
}

export interface ContextItem {
  id: string;
  name: string;
  type: 'code' | 'doc' | 'schema' | 'image' | 'pdf';
  size: string;
  tokenCount: number;
  snippet?: string;
  isSelected: boolean;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'Convention' | 'Preference' | 'API Spec' | 'Architecture';
  lastUpdated: string;
}

export interface AITaskItem {
  id: string;
  title: string;
  assignedAgent: AgentRole;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  outputSnippet?: string;
}

export interface ModelConfig {
  modelName: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  systemInstruction: string;
}

export interface Agent {
  id: AgentRole;
  name: string;
  avatar: string;
  title: string;
  color: string;
  bgLight: string;
  borderAccent: string;
  status: 'idle' | 'thinking' | 'coding' | 'reviewing' | 'completed';
  description: string;
  specialty: string;
}

export interface AgentMessage {
  id: string;
  agentRole: AgentRole;
  timestamp: string;
  thought?: string;
  content: string;
  plan?: string[];
  codeSnippet?: string;
  suggestedCommands?: string[];
  reviewNotes?: string;
  status?: 'info' | 'success' | 'warning' | 'error';
}

export interface VFSNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  language?: string;
  children?: VFSNode[];
  isModified?: boolean;
}

export interface OpenTab {
  nodeId: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isModified?: boolean;
}

export interface FactoryStage {
  id: number;
  name: string;
  category: 'Planning' | 'Synthesis' | 'Verification' | 'Deployment' | 'Monitoring';
  status: 'pending' | 'running' | 'completed' | 'failed';
  durationMs?: number;
  logs: string[];
  autoRemediated?: boolean;
  description: string;
}

export interface DBTable {
  name: string;
  description: string;
  rowCount: number;
  columns: {
    name: string;
    type: string;
    isPrimary?: boolean;
    isNullable?: boolean;
    foreignKey?: string;
  }[];
  sampleData: Record<string, any>[];
}

export interface PatternItem {
  id: string;
  title: string;
  category: string;
  reusabilityScore: number;
  timesApplied: number;
  description: string;
  codeTemplate: string;
}

export interface TechDebtItem {
  id: string;
  file: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestedFix: string;
}

export interface PropertyItem {
  id: string;
  name: string;
  type: 'Commercial' | 'Residential' | 'Mixed-Use' | 'Industrial';
  address: string;
  units: number;
  occupancyRate: number;
  monthlyRevenue: number;
  aiMaintenanceScore: number;
  status: 'Optimal' | 'Attention' | 'Leasing';
}

export interface MediaAsset {
  id: string;
  title: string;
  type: 'Image Prompt' | 'Video Script' | 'UI Component' | 'Brand Asset';
  concept: string;
  description: string;
  tags: string[];
  dateCreated: string;
  previewUrl?: string;
}

// OPROX Code / AI Phase 3 Types
export interface ProjectGeneratorConfig {
  projectName: string;
  description: string;
  template: 'fullstack' | 'microservices' | 'mobile' | 'api_gateway' | 'realtime_dashboard';
  architecture: 'monolith' | 'modular_monolith' | 'microservices' | 'serverless' | 'event_driven';
  techStack: 'react_node' | 'next_express' | 'vue_vite' | 'python_fastapi' | 'go_gin';
  database: 'postgresql_drizzle' | 'firestore' | 'mongodb' | 'mysql' | 'sqlite';
  auth: 'jwt' | 'oauth2' | 'firebase_auth' | 'clerk' | 'auth0';
  deploymentTarget: 'cloud_run' | 'vercel' | 'aws_ecs' | 'docker_swarm' | 'kubernetes';
  createdAt: string;
}

export type SpecialistAgentRole =
  | 'architect'
  | 'backend'
  | 'frontend'
  | 'mobile'
  | 'database'
  | 'devops'
  | 'qa'
  | 'security'
  | 'documentation';

export interface AgentHandoffRecord {
  id: string;
  fromAgent: SpecialistAgentRole;
  toAgent: SpecialistAgentRole;
  taskTitle: string;
  outputSummary: string;
  timestamp: string;
  status: 'passed' | 'in_progress' | 'blocked' | 'failed';
}

export interface PipelineTaskNode {
  id: string;
  title: string;
  assignedAgent: SpecialistAgentRole;
  executionType?: string;
  input?: string;
  dependencies: string[]; // IDs of prerequisite tasks
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  retryCount: number;
  maxRetries: number;
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkspaceSyncState {
  fileState: { totalFiles: number; dirtyFiles: number; syncStatus: 'synced' | 'syncing' | 'dirty' | 'error' };
  buildState: { status: 'idle' | 'building' | 'success' | 'failed' | 'not_built'; bundleSize: string; lastBuildTime: string };
  testState: { totalTests: number; passed: number; failed: number; coverage: string };
  gitState: { branch: string; commitHash: string; uncommittedChanges: number };
  deploymentState: { target: string; status: 'active' | 'deploying' | 'offline' | 'NOT_CONFIGURED'; health: string; url: string };
}

export interface ReleaseCandidate {
  id: string;
  version: string; // e.g., '2.5.0-rc1'
  semverType: 'major' | 'minor' | 'patch';
  releaseNotes: string;
  readinessScore: number;
  goNoGo: 'GO' | 'NO_GO' | 'NO-GO';
  checklist: { id: string; label: string; completed: boolean }[];
  createdAt: string;
  status: 'draft' | 'approved' | 'released';
}

export type LifecycleStage =
  | 'idea'
  | 'requirements'
  | 'planning'
  | 'architecture'
  | 'tasks'
  | 'code_generation'
  | 'patching'
  | 'testing'
  | 'security_review'
  | 'documentation'
  | 'git'
  | 'build'
  | 'release'
  | 'deployment';

export interface CodePatchItem {
  id: string;
  filePath: string;
  action: 'create' | 'edit' | 'delete' | 'refactor';
  originalContent: string;
  patchedContent: string;
  diffSummary: string;
  timestamp: string;
  status: 'pending' | 'applied' | 'rolled_back';
}

export interface SymbolIndexItem {
  id: string;
  name: string;
  kind: 'function' | 'interface' | 'class' | 'variable' | 'type' | 'enum';
  filePath: string;
  line: number;
  usagesCount: number;
  exported: boolean;
  signature?: string;
}

export interface CodeReviewFinding {
  id: string;
  category: 'Bugs' | 'Performance' | 'Security (OWASP)' | 'Maintainability' | 'Architecture' | 'Clean Code' | 'Accessibility' | 'Type Safety';
  severity: 'critical' | 'high' | 'medium' | 'low';
  filePath: string;
  line?: number;
  title: string;
  description: string;
  recommendation: string;
  codeSnippet?: string;
  status: 'open' | 'fixed' | 'dismissed';
}

export interface GeneratedTestFile {
  id: string;
  title: string;
  testType: 'unit' | 'integration' | 'api' | 'edge_case' | 'regression';
  targetFilePath: string;
  testFilePath: string;
  testCode: string;
  assertionsCount: number;
  status: 'pending' | 'passed' | 'failed';
}

export interface DocArtifact {
  id: string;
  docType: 'readme' | 'api' | 'architecture' | 'deployment' | 'changelog' | 'release_notes';
  title: string;
  targetPath: string;
  markdownContent: string;
  lastGenerated: string;
}

