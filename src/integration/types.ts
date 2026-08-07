// OPROX Phase 11 — Integration Contracts & Data Models

import { AppMode, IndustrySolution, SolutionActivityLog, SolutionPermission, AITaskItem, ContextItem, MemoryItem, ModelConfig } from '../types';

// ==========================================
// 1. CONTRACT DEFINITIONS
// ==========================================

export type OperationStatus = 'idle' | 'loading' | 'revalidating' | 'completed' | 'error';

export interface LoadingContract {
  status: OperationStatus;
  progressPercent: number;
  currentStep: string;
  totalSteps?: number;
  estimatedRemainingMs?: number;
  message?: string;
}

export interface ErrorContract {
  errorCode: string;
  domain: 'SOLUTION' | 'AI_ENGINE' | 'DATABASE' | 'MEDIA' | 'PROPTECH' | 'PLATFORM' | 'AUTH' | 'SYSTEM';
  userMessage: string;
  rawMessage?: string;
  diagnosticDetails?: string;
  recoverable: boolean;
  retryActionName?: string;
  timestamp: string;
}

export interface SuccessContract<T = any> {
  status: 'success';
  payload: T;
  metadata: {
    timestamp: string;
    executionTimeMs: number;
    auditId: string;
    sourceService: string;
    itemCount?: number;
  };
}

export type AsyncResult<T> =
  | { success: true; data: SuccessContract<T> }
  | { success: false; error: ErrorContract };

// ==========================================
// 2. EVENT CONTRACTS & NAMES
// ==========================================

export const OPROX_EVENTS = {
  // Navigation & Shell
  NAVIGATION_CHANGE: 'oprox:navigation:change',
  MODE_SWITCH: 'oprox:mode:switch',
  PLATFORM_SUBPAGE_CHANGE: 'oprox:platform:subpage_change',
  THEME_CHANGE: 'oprox:theme:change',

  // Industry Solutions
  SOLUTION_SELECT: 'oprox:solution:select',
  SOLUTION_INSTALL: 'oprox:solution:install',
  SOLUTION_UNINSTALL: 'oprox:solution:uninstall',
  SOLUTION_CONFIG_UPDATE: 'oprox:solution:config_update',
  SOLUTION_ACTIVITY_LOGGED: 'oprox:solution:activity_logged',

  // AI & Swarm OS
  AI_PROMPT_SUBMIT: 'oprox:ai:prompt_submit',
  AI_TASK_PROGRESS: 'oprox:ai:task_progress',
  AI_AGENT_ASSIGNED: 'oprox:ai:agent_assigned',

  // IDE & Engineering
  IDE_FILE_CHANGE: 'oprox:ide:file_change',
  IDE_BUILD_EXECUTE: 'oprox:ide:build_execute',

  // Database & Storage
  DB_QUERY_EXECUTE: 'oprox:db:query_execute',
  DB_MIGRATION_RUN: 'oprox:db:migration_run',

  // Verticals (Media & PropTech)
  MEDIA_RENDER_REQUEST: 'oprox:media:render_request',
  PROPTECH_ANALYTICS_FETCH: 'oprox:proptech:analytics_fetch',

  // Platform Administration
  PLATFORM_PAGE_AUDIT: 'oprox:platform:page_audit',
  NOTIFICATION_EMIT: 'oprox:notification:emit',
  SYSTEM_ERROR_LOG: 'oprox:system:error_log'
} as const;

export type OproxEventName = typeof OPROX_EVENTS[keyof typeof OPROX_EVENTS];

export interface SystemEvent<T = any> {
  eventId: string;
  eventName: OproxEventName;
  domain: string;
  payload: T;
  timestamp: string;
  userId: string;
  sourceComponent: string;
}

export type EventListenerCallback<T = any> = (event: SystemEvent<T>) => void;

// ==========================================
// 3. NAVIGATION STRUCTURE & ROUTE MAPPING
// ==========================================

export interface RouteDefinition {
  path: string;
  mode: AppMode;
  category: string;
  label: string;
  description: string;
  iconName: string;
  requiresAuth: boolean;
  subpageId?: string;
  queryParams?: Record<string, string>;
}

export interface NavigationBreadcrumb {
  id: string;
  label: string;
  path: string;
  mode: AppMode;
  active: boolean;
}

// ==========================================
// 4. MOCK SERVICE INTERFACES
// ==========================================

export interface SolutionFilterParams {
  category?: string;
  searchQuery?: string;
  status?: string;
  featuredOnly?: boolean;
}

export interface ISolutionService {
  getSolutions(params?: SolutionFilterParams): Promise<SuccessContract<IndustrySolution[]>>;
  getSolutionById(id: string): Promise<SuccessContract<IndustrySolution | null>>;
  installSolution(id: string): Promise<AsyncResult<IndustrySolution>>;
  uninstallSolution(id: string): Promise<AsyncResult<IndustrySolution>>;
  getActivityLogs(solutionId: string): Promise<SuccessContract<SolutionActivityLog[]>>;
  getPermissions(solutionId: string): Promise<SuccessContract<SolutionPermission[]>>;
}

export interface IAiOsService {
  submitPrompt(prompt: string): Promise<SuccessContract<{ taskId: string; initialAgents: string[] }>>;
  getTasks(): Promise<SuccessContract<AITaskItem[]>>;
  getContextItems(): Promise<SuccessContract<ContextItem[]>>;
  getMemoryItems(): Promise<SuccessContract<MemoryItem[]>>;
  updateModelConfig(config: Partial<ModelConfig>): Promise<SuccessContract<ModelConfig>>;
}

export interface ICloudDatabaseService {
  executeQuery(sql: string): Promise<AsyncResult<{ rows: any[]; executionTimeMs: number; affectedRows: number }>>;
  getTables(): Promise<SuccessContract<{ name: string; rowsCount: number; sizeMB: number }[]>>;
  runMigration(migrationName: string): Promise<AsyncResult<{ status: string; appliedAt: string }>>;
}

export interface IMediaStudioService {
  renderFrameSequence(projectId: string, quality: 'draft' | '4k' | '8k'): Promise<AsyncResult<{ renderUrl: string; frameCount: number }>>;
  synthesizeAudioTrack(prompt: string, voiceId: string): Promise<AsyncResult<{ audioUrl: string; durationSec: number }>>;
}

export interface IPropTechService {
  getPropertyAnalytics(propertyId: string): Promise<SuccessContract<{
    occupancyRate: number;
    monthlyRevenue: string;
    energyEfficiencyIndex: number;
    maintenanceRequests: number;
  }>>;
  runRoiSimulation(inputs: { propertyValue: number; rentalIncome: number; expenseRatio: number }): Promise<SuccessContract<{
    capRate: number;
    cashOnCashRoi: number;
    estimated5YearValue: number;
  }>>;
}

export interface PlatformPageAuditEntry {
  pageId: string;
  pageName: string;
  healthScore: number;
  lastChecked: string;
  activeErrorsCount: number;
  averageLatencyMs: number;
}

export interface IPlatformSuiteService {
  getPlatformPageAudits(): Promise<SuccessContract<PlatformPageAuditEntry[]>>;
  triggerSelfHealing(pageId: string): Promise<AsyncResult<{ resolved: boolean; fixDetails: string }>>;
}

// ==========================================
// 5. NOTIFICATION CONTRACT
// ==========================================

export interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  autoDismissMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}
