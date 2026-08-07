# OPROX Core — Integration Specifications & Contracts (Phase 11)

This document specifies the contracts, data models, mock services, navigation mappings, event bus architecture, and UI state management implemented in **Phase 11 (UI Integration Preparation)**.

---

## 1. Integration Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      OPROX Shell UI                         │
 │     (Header, Dashboard, AI OS, Solutions, Platform Hub)      │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               UIStateContext & Event Bus                    │
 │  • Current Mode & Routes       • Active Loading/Errors      │
 │  • Theme & Notifications       • System Event Dispatch      │
 └──────────────────────────────┬──────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
 ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
 │  SolutionService  │ │    AiOsService    │ │ DatabaseService   │
 └───────────────────┘ └───────────────────┘ └───────────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
 ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
 │ MediaStudioService│ │ PropTechService   │ │PlatformSuiteServ. │
 └───────────────────┘ └───────────────────┘ └───────────────────┘
```

---

## 2. Standardized Response & Error Contracts

### Success Contract (`SuccessContract<T>`)
```typescript
interface SuccessContract<T> {
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
```

### Error Contract (`ErrorContract`)
```typescript
interface ErrorContract {
  errorCode: string;
  domain: 'SOLUTION' | 'AI_ENGINE' | 'DATABASE' | 'MEDIA' | 'PROPTECH' | 'PLATFORM' | 'AUTH' | 'SYSTEM';
  userMessage: string;
  rawMessage?: string;
  diagnosticDetails?: string;
  recoverable: boolean;
  retryActionName?: string;
  timestamp: string;
}
```

### Async Result Type (`AsyncResult<T>`)
```typescript
type AsyncResult<T> =
  | { success: true; data: SuccessContract<T> }
  | { success: false; error: ErrorContract };
```

---

## 3. System Event Bus (`OPROX_EVENTS`)

All UI actions emit typed events via `dispatchSystemEvent(eventName, payload, sourceComponent)`:

| Event Name | Domain | Payload Description |
| :--- | :--- | :--- |
| `oprox:navigation:change` | `navigation` | Target path, previous path |
| `oprox:mode:switch` | `mode` | `{ previousMode, nextMode }` |
| `oprox:solution:select` | `solution` | Solution ID, solution object |
| `oprox:solution:install` | `solution` | Installed solution payload |
| `oprox:ai:prompt_submit` | `ai` | `{ taskId, prompt }` |
| `oprox:db:query_execute` | `db` | SQL string, execution time |
| `oprox:media:render_request`| `media` | Project ID, render quality |
| `oprox:proptech:analytics_fetch` | `proptech` | Property ID, metrics |
| `oprox:platform:page_audit` | `platform` | Health scores for 33 subpages |
| `oprox:notification:emit` | `system` | Notification object |

---

## 4. Mock Services Reference

### `solutionService`
- `getSolutions(params?: SolutionFilterParams)` → `Promise<SuccessContract<IndustrySolution[]>>`
- `getSolutionById(id: string)` → `Promise<SuccessContract<IndustrySolution \| null>>`
- `installSolution(id: string)` → `Promise<AsyncResult<IndustrySolution>>`
- `uninstallSolution(id: string)` → `Promise<AsyncResult<IndustrySolution>>`
- `getActivityLogs(solutionId: string)` → `Promise<SuccessContract<SolutionActivityLog[]>>`
- `getPermissions(solutionId: string)` → `Promise<SuccessContract<SolutionPermission[]>>`

### `aiOsService`
- `submitPrompt(prompt: string)` → `Promise<SuccessContract<{ taskId: string; initialAgents: string[] }>>`
- `getTasks()` → `Promise<SuccessContract<AITaskItem[]>>`
- `getContextItems()` → `Promise<SuccessContract<ContextItem[]>>`
- `getMemoryItems()` → `Promise<SuccessContract<MemoryItem[]>>`
- `updateModelConfig(config)` → `Promise<SuccessContract<ModelConfig>>`

### `databaseService`
- `executeQuery(sql: string)` → `Promise<AsyncResult<{ rows: any[]; executionTimeMs: number; affectedRows: number }>>`
- `getTables()` → `Promise<SuccessContract<TableInfo[]>>`
- `runMigration(migrationName: string)` → `Promise<AsyncResult<{ status: string; appliedAt: string }>>`

### `mediaStudioService`
- `renderFrameSequence(projectId, quality)` → `Promise<AsyncResult<{ renderUrl: string; frameCount: number }>>`
- `synthesizeAudioTrack(prompt, voiceId)` → `Promise<AsyncResult<{ audioUrl: string; durationSec: number }>>`

### `propTechService`
- `getPropertyAnalytics(propertyId)` → `Promise<SuccessContract<PropertyAnalytics>>`
- `runRoiSimulation(inputs)` → `Promise<SuccessContract<RoiOutput>>`

### `platformSuiteService`
- `getPlatformPageAudits()` → `Promise<SuccessContract<PlatformPageAuditEntry[]>>`
- `triggerSelfHealing(pageId)` → `Promise<AsyncResult<{ resolved: boolean; fixDetails: string }>>`

---

## 5. UI Integration Checklist for Phase 12 (Core Binding)

- [x] Unified component prop naming convention across all 11 core modes and 33 platform pages.
- [x] Standardized TypeScript interface definitions in `/src/types.ts` and `/src/integration/types.ts`.
- [x] Decoupled business logic and network calls into mock services layer (`/src/integration/services.ts`).
- [x] Global UI State Context (`UIStateProvider`) wrapping top-level application shell.
- [x] Toast notification system with error/warning/success feedback contracts.
- [x] Complete navigation routing definition map (`OPROX_ROUTES`).
- [x] Event bus contract for decoupled event dispatching and subscription.

---

**Phase 11 complete.** The UI architecture is fully structured, typed, and prepared for direct binding with OPROX Core in the next phase.
