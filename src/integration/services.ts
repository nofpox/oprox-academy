// OPROX Phase 11 — Mock Services Implementation

import {
  ISolutionService,
  IAiOsService,
  ICloudDatabaseService,
  IMediaStudioService,
  IPropTechService,
  IPlatformSuiteService,
  SuccessContract,
  AsyncResult,
  ErrorContract,
  SolutionFilterParams,
  PlatformPageAuditEntry
} from './types';
import { IndustrySolution, SolutionActivityLog, SolutionPermission, AITaskItem, ContextItem, MemoryItem, ModelConfig } from '../types';
import { MOCK_SOLUTIONS, MOCK_ACTIVITY_LOGS, MOCK_PERMISSIONS } from '../data/solutionsData';
import { INITIAL_AI_TASKS, INITIAL_CONTEXT_ITEMS, INITIAL_MEMORY_ITEMS, DEFAULT_MODEL_CONFIG } from '../data/aiOsData';

// Helper to simulate latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for generating audit IDs
const generateAuditId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 9)}`;

// ==========================================
// 1. SOLUTION SERVICE
// ==========================================

export class MockSolutionService implements ISolutionService {
  private solutionsStore: IndustrySolution[] = [...MOCK_SOLUTIONS];
  private activityLogsStore: SolutionActivityLog[] = [...MOCK_ACTIVITY_LOGS];

  async getSolutions(params?: SolutionFilterParams): Promise<SuccessContract<IndustrySolution[]>> {
    await delay(250);
    let filtered = [...this.solutionsStore];

    if (params?.category && params.category !== 'All') {
      filtered = filtered.filter((s) => s.category === params.category);
    }
    if (params?.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params?.status) {
      filtered = filtered.filter((s) => s.status === params.status);
    }
    if (params?.featuredOnly) {
      filtered = filtered.filter((s) => s.isFeatured);
    }

    return {
      status: 'success',
      payload: filtered,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 250,
        auditId: generateAuditId('sol_get'),
        sourceService: 'MockSolutionService',
        itemCount: filtered.length
      }
    };
  }

  async getSolutionById(id: string): Promise<SuccessContract<IndustrySolution | null>> {
    await delay(150);
    const item = this.solutionsStore.find((s) => s.id === id) || null;
    return {
      status: 'success',
      payload: item,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 150,
        auditId: generateAuditId('sol_by_id'),
        sourceService: 'MockSolutionService'
      }
    };
  }

  async installSolution(id: string): Promise<AsyncResult<IndustrySolution>> {
    await delay(600);
    const index = this.solutionsStore.findIndex((s) => s.id === id);
    if (index === -1) {
      return {
        success: false,
        error: {
          errorCode: 'ERR_SOLUTION_NOT_FOUND',
          domain: 'SOLUTION',
          userMessage: `Target solution with ID ${id} was not found in registry.`,
          recoverable: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    const updated = {
      ...this.solutionsStore[index],
      isInstalled: true,
      status: 'Active' as const,
      installCount: this.solutionsStore[index].installCount + 1
    };
    this.solutionsStore[index] = updated;

    // Log activity
    const newLog: SolutionActivityLog = {
      id: `act_${Date.now()}`,
      solutionId: id,
      action: `Installed solution: ${updated.name}`,
      user: 'OPROX Administrator',
      timestamp: 'Just now',
      status: 'success'
    };
    this.activityLogsStore.unshift(newLog);

    return {
      success: true,
      data: {
        status: 'success',
        payload: updated,
        metadata: {
          timestamp: new Date().toISOString(),
          executionTimeMs: 600,
          auditId: generateAuditId('sol_inst'),
          sourceService: 'MockSolutionService'
        }
      }
    };
  }

  async uninstallSolution(id: string): Promise<AsyncResult<IndustrySolution>> {
    await delay(400);
    const index = this.solutionsStore.findIndex((s) => s.id === id);
    if (index === -1) {
      return {
        success: false,
        error: {
          errorCode: 'ERR_SOLUTION_NOT_FOUND',
          domain: 'SOLUTION',
          userMessage: `Target solution with ID ${id} was not found in registry.`,
          recoverable: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    const updated = {
      ...this.solutionsStore[index],
      isInstalled: false,
      status: 'Available' as const
    };
    this.solutionsStore[index] = updated;

    return {
      success: true,
      data: {
        status: 'success',
        payload: updated,
        metadata: {
          timestamp: new Date().toISOString(),
          executionTimeMs: 400,
          auditId: generateAuditId('sol_uninst'),
          sourceService: 'MockSolutionService'
        }
      }
    };
  }

  async getActivityLogs(solutionId: string): Promise<SuccessContract<SolutionActivityLog[]>> {
    await delay(150);
    const logs = this.activityLogsStore.filter((l) => l.solutionId === solutionId || solutionId === 'all');
    return {
      status: 'success',
      payload: logs,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 150,
        auditId: generateAuditId('sol_act'),
        sourceService: 'MockSolutionService',
        itemCount: logs.length
      }
    };
  }

  async getPermissions(solutionId: string): Promise<SuccessContract<SolutionPermission[]>> {
    await delay(150);
    return {
      status: 'success',
      payload: MOCK_PERMISSIONS,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 150,
        auditId: generateAuditId('sol_perm'),
        sourceService: 'MockSolutionService'
      }
    };
  }
}

// ==========================================
// 2. AI OPERATING SYSTEM SERVICE
// ==========================================

export class MockAiOsService implements IAiOsService {
  private tasksStore: AITaskItem[] = [...INITIAL_AI_TASKS];
  private contextStore: ContextItem[] = [...INITIAL_CONTEXT_ITEMS];
  private memoryStore: MemoryItem[] = [...INITIAL_MEMORY_ITEMS];
  private modelConfigStore: ModelConfig = { ...DEFAULT_MODEL_CONFIG };

  async submitPrompt(prompt: string): Promise<SuccessContract<{ taskId: string; initialAgents: string[] }>> {
    await delay(350);
    const newTaskId = `task_${Date.now()}`;
    const newTask: AITaskItem = {
      id: newTaskId,
      title: prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt,
      assignedAgent: 'Architect',
      status: 'in_progress',
      priority: 'high',
      outputSnippet: 'Analyzing prompt AST and delegating sub-goals to Swarm Agents...'
    };
    this.tasksStore.unshift(newTask);

    return {
      status: 'success',
      payload: {
        taskId: newTaskId,
        initialAgents: ['Planner', 'Architect', 'Coder', 'Reviewer']
      },
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 350,
        auditId: generateAuditId('ai_prompt'),
        sourceService: 'MockAiOsService'
      }
    };
  }

  async getTasks(): Promise<SuccessContract<AITaskItem[]>> {
    await delay(100);
    return {
      status: 'success',
      payload: this.tasksStore,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 100,
        auditId: generateAuditId('ai_tasks'),
        sourceService: 'MockAiOsService',
        itemCount: this.tasksStore.length
      }
    };
  }

  async getContextItems(): Promise<SuccessContract<ContextItem[]>> {
    await delay(100);
    return {
      status: 'success',
      payload: this.contextStore,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 100,
        auditId: generateAuditId('ai_context'),
        sourceService: 'MockAiOsService',
        itemCount: this.contextStore.length
      }
    };
  }

  async getMemoryItems(): Promise<SuccessContract<MemoryItem[]>> {
    await delay(100);
    return {
      status: 'success',
      payload: this.memoryStore,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 100,
        auditId: generateAuditId('ai_memory'),
        sourceService: 'MockAiOsService',
        itemCount: this.memoryStore.length
      }
    };
  }

  async updateModelConfig(config: Partial<ModelConfig>): Promise<SuccessContract<ModelConfig>> {
    await delay(150);
    this.modelConfigStore = { ...this.modelConfigStore, ...config };
    return {
      status: 'success',
      payload: this.modelConfigStore,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 150,
        auditId: generateAuditId('ai_cfg'),
        sourceService: 'MockAiOsService'
      }
    };
  }
}

// ==========================================
// 3. DATABASE SERVICE
// ==========================================

export class MockCloudDatabaseService implements ICloudDatabaseService {
  async executeQuery(sql: string): Promise<AsyncResult<{ rows: any[]; executionTimeMs: number; affectedRows: number }>> {
    await delay(200);
    if (sql.toLowerCase().includes('syntax_error')) {
      return {
        success: false,
        error: {
          errorCode: 'ERR_SQL_SYNTAX',
          domain: 'DATABASE',
          userMessage: 'PostgreSQL syntax error near position 14.',
          rawMessage: 'ERROR: syntax error at or near "SYNTAX_ERROR"',
          diagnosticDetails: 'HINT: Check table identifier quotes and column aliases.',
          recoverable: true,
          retryActionName: 'Fix SQL Statement',
          timestamp: new Date().toISOString()
        }
      };
    }

    return {
      success: true,
      data: {
        status: 'success',
        payload: {
          rows: [
            { id: 'usr_1', email: 'admin@oprox.io', role: 'SUPER_ADMIN', status: 'ACTIVE', created_at: '2026-01-15' },
            { id: 'usr_2', email: 'dev@oprox.io', role: 'DEVELOPER', status: 'ACTIVE', created_at: '2026-02-01' }
          ],
          executionTimeMs: 42,
          affectedRows: 2
        },
        metadata: {
          timestamp: new Date().toISOString(),
          executionTimeMs: 200,
          auditId: generateAuditId('db_query'),
          sourceService: 'MockCloudDatabaseService'
        }
      }
    };
  }

  async getTables(): Promise<SuccessContract<{ name: string; rowsCount: number; sizeMB: number }[]>> {
    await delay(150);
    return {
      status: 'success',
      payload: [
        { name: 'users', rowsCount: 1420, sizeMB: 4.2 },
        { name: 'audit_logs', rowsCount: 89100, sizeMB: 48.5 },
        { name: 'solutions_registry', rowsCount: 12, sizeMB: 0.8 },
        { name: 'ai_vector_store', rowsCount: 235000, sizeMB: 184.0 }
      ],
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 150,
        auditId: generateAuditId('db_tbl'),
        sourceService: 'MockCloudDatabaseService'
      }
    };
  }

  async runMigration(migrationName: string): Promise<AsyncResult<{ status: string; appliedAt: string }>> {
    await delay(500);
    return {
      success: true,
      data: {
        status: 'success',
        payload: {
          status: 'APPLIED',
          appliedAt: new Date().toISOString()
        },
        metadata: {
          timestamp: new Date().toISOString(),
          executionTimeMs: 500,
          auditId: generateAuditId('db_mig'),
          sourceService: 'MockCloudDatabaseService'
        }
      }
    };
  }
}

// ==========================================
// 4. MEDIA STUDIO SERVICE
// ==========================================

export class MockMediaStudioService implements IMediaStudioService {
  async renderFrameSequence(projectId: string, quality: 'draft' | '4k' | '8k'): Promise<AsyncResult<{ renderUrl: string; frameCount: number }>> {
    await delay(800);
    return {
      success: true,
      data: {
        status: 'success',
        payload: {
          renderUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          frameCount: quality === '8k' ? 2400 : 1200
        },
        metadata: {
          timestamp: new Date().toISOString(),
          executionTimeMs: 800,
          auditId: generateAuditId('media_rndr'),
          sourceService: 'MockMediaStudioService'
        }
      }
    };
  }

  async synthesizeAudioTrack(prompt: string, voiceId: string): Promise<AsyncResult<{ audioUrl: string; durationSec: number }>> {
    await delay(600);
    return {
      success: true,
      data: {
        status: 'success',
        payload: {
          audioUrl: '/mock/audio/synthesis_output.mp3',
          durationSec: 18.4
        },
        metadata: {
          timestamp: new Date().toISOString(),
          executionTimeMs: 600,
          auditId: generateAuditId('media_tts'),
          sourceService: 'MockMediaStudioService'
        }
      }
    };
  }
}

// ==========================================
// 5. PROPTECH SERVICE
// ==========================================

export class MockPropTechService implements IPropTechService {
  async getPropertyAnalytics(propertyId: string): Promise<SuccessContract<{
    occupancyRate: number;
    monthlyRevenue: string;
    energyEfficiencyIndex: number;
    maintenanceRequests: number;
  }>> {
    await delay(200);
    return {
      status: 'success',
      payload: {
        occupancyRate: 96.4,
        monthlyRevenue: '$148,500',
        energyEfficiencyIndex: 92,
        maintenanceRequests: 3
      },
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 200,
        auditId: generateAuditId('pt_analytics'),
        sourceService: 'MockPropTechService'
      }
    };
  }

  async runRoiSimulation(inputs: { propertyValue: number; rentalIncome: number; expenseRatio: number }): Promise<SuccessContract<{
    capRate: number;
    cashOnCashRoi: number;
    estimated5YearValue: number;
  }>> {
    await delay(300);
    const netIncome = inputs.rentalIncome * 12 * (1 - inputs.expenseRatio / 100);
    const capRate = Number(((netIncome / inputs.propertyValue) * 100).toFixed(2));
    const estimated5YearValue = Math.round(inputs.propertyValue * 1.22);

    return {
      status: 'success',
      payload: {
        capRate,
        cashOnCashRoi: Number((capRate * 1.35).toFixed(2)),
        estimated5YearValue
      },
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 300,
        auditId: generateAuditId('pt_roi'),
        sourceService: 'MockPropTechService'
      }
    };
  }
}

// ==========================================
// 6. PLATFORM SUITE SERVICE
// ==========================================

export class MockPlatformSuiteService implements IPlatformSuiteService {
  async getPlatformPageAudits(): Promise<SuccessContract<PlatformPageAuditEntry[]>> {
    await delay(200);
    return {
      status: 'success',
      payload: [
        { pageId: 'overview-dashboard', pageName: 'System Core Dashboard', healthScore: 99, lastChecked: '1 min ago', activeErrorsCount: 0, averageLatencyMs: 28 },
        { pageId: 'ai-orchestrator', pageName: 'AI Swarm Orchestrator', healthScore: 98, lastChecked: '2 mins ago', activeErrorsCount: 0, averageLatencyMs: 42 },
        { pageId: 'cloud-db-manager', pageName: 'PostgreSQL Cloud DB', healthScore: 100, lastChecked: '3 mins ago', activeErrorsCount: 0, averageLatencyMs: 18 },
        { pageId: 'media-renderer-node', pageName: '4K GPU Media Node', healthScore: 95, lastChecked: '5 mins ago', activeErrorsCount: 1, averageLatencyMs: 145 },
        { pageId: 'proptech-telemetry', pageName: 'Building IoT Ingress', healthScore: 99, lastChecked: '1 min ago', activeErrorsCount: 0, averageLatencyMs: 31 }
      ],
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 200,
        auditId: generateAuditId('plt_audit'),
        sourceService: 'MockPlatformSuiteService'
      }
    };
  }

  async triggerSelfHealing(pageId: string): Promise<AsyncResult<{ resolved: boolean; fixDetails: string }>> {
    await delay(700);
    return {
      success: true,
      data: {
        status: 'success',
        payload: {
          resolved: true,
          fixDetails: `Self-healing routine successfully purged stale cache and re-balanced container workers for page ${pageId}.`
        },
        metadata: {
          timestamp: new Date().toISOString(),
          executionTimeMs: 700,
          auditId: generateAuditId('plt_heal'),
          sourceService: 'MockPlatformSuiteService'
        }
      }
    };
  }
}

// Instantiate Service Singletons
export const solutionService = new MockSolutionService();
export const aiOsService = new MockAiOsService();
export const databaseService = new MockCloudDatabaseService();
export const mediaStudioService = new MockMediaStudioService();
export const propTechService = new MockPropTechService();
export const platformSuiteService = new MockPlatformSuiteService();
