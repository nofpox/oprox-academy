import { PromptTemplate, ContextItem, MemoryItem, AITaskItem, ModelConfig, AgentMessage } from '../types';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  modelName: 'Gemini 2.5 Pro (Multi-Agent Swarm)',
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  systemInstruction: `You are the lead orchestrator of the OPROX Multi-Agent Software Factory. Coordinates Planner, Architect, Developer, Reviewer, QA, and DevOps agents to generate production-ready TypeScript code, database schemas, and Cloud Run deployment manifests with zero human intervention.`
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'tmpl-1',
    title: 'Full-Stack Microservice Blueprint',
    category: 'Scaffolding',
    description: 'Generate Express.js + Vite + TypeScript API routes with esbuild bundling & Dockerfile.',
    templateText: 'Scaffold a production-grade microservice for {{service_name}} with REST endpoints, PostgreSQL Drizzle ORM, and Health monitoring on port 3000.',
    variables: ['service_name']
  },
  {
    id: 'tmpl-2',
    title: 'AST Code Security & Type Auditor',
    category: 'Security',
    description: 'Analyze code imports, sanitize external inputs, and eliminate implicit any types.',
    templateText: 'Perform an AST security scan on {{target_file}}. Check for SQL injection vectors, missing environment variable fallbacks, and memory leaks.',
    variables: ['target_file']
  },
  {
    id: 'tmpl-3',
    title: 'Autonomous Vitest Suite Generator',
    category: 'Testing',
    description: 'Create unit and integration test suites with 100% path coverage mock assertions.',
    templateText: 'Write comprehensive Vitest test cases for {{component_path}} covering success, error boundaries, and asynchronous state resolution.',
    variables: ['component_path']
  },
  {
    id: 'tmpl-4',
    title: 'Drizzle PostgreSQL Migration Schema',
    category: 'Scaffolding',
    description: 'Define relational database tables with foreign keys and multi-tenant row security.',
    templateText: 'Design a Drizzle ORM schema for {{domain_entity}} with indexes, foreign key cascading, and automated timestamp triggers.',
    variables: ['domain_entity']
  }
];

export const INITIAL_CONTEXT_ITEMS: ContextItem[] = [
  {
    id: 'ctx-1',
    name: 'server.ts (Express Entry)',
    type: 'code',
    size: '1.8 KB',
    tokenCount: 420,
    snippet: `app.listen(PORT, "0.0.0.0", () => { console.log(\`Server running on port \${PORT}\`); });`,
    isSelected: true
  },
  {
    id: 'ctx-2',
    name: 'schema.ts (Drizzle PostgreSQL)',
    type: 'schema',
    size: '4.2 KB',
    tokenCount: 1150,
    snippet: `export const users = pgTable('users', { id: serial('id').primaryKey(), email: text('email').notNull() });`,
    isSelected: true
  },
  {
    id: 'ctx-3',
    name: 'OPROX Architecture Spec v4.pdf',
    type: 'doc',
    size: '184 KB',
    tokenCount: 8400,
    snippet: `Section 4.2: All Cloud Run containers must bind strictly to 0.0.0.0:3000 and expose /api/health.`,
    isSelected: true
  },
  {
    id: 'ctx-4',
    name: 'CloudRun-Deployment-Spec.json',
    type: 'doc',
    size: '12 KB',
    tokenCount: 2100,
    snippet: `{ "service": "oprox-core", "region": "europe-west2", "memory": "512Mi" }`,
    isSelected: false
  }
];

export const INITIAL_MEMORY_ITEMS: MemoryItem[] = [
  {
    id: 'mem-1',
    key: 'Network Ingress Constraint',
    value: 'Port 3000 is the ONLY externally accessible port. Dev server MUST bind to host 0.0.0.0.',
    category: 'Architecture',
    lastUpdated: '10m ago'
  },
  {
    id: 'mem-2',
    key: 'Server Bundling Standard',
    value: 'Must use esbuild to bundle server.ts into dist/server.cjs in CJS format to bypass ESM checks.',
    category: 'Convention',
    lastUpdated: '25m ago'
  },
  {
    id: 'mem-3',
    key: 'UI Styling System',
    value: 'Strict adherence to Tailwind CSS, Lucide Icons, and no pure #000 or #FFF backgrounds.',
    category: 'Preference',
    lastUpdated: '1 hour ago'
  }
];

export const INITIAL_AI_TASKS: AITaskItem[] = [
  {
    id: 'task-101',
    title: 'Planner: Parse specification requirements & create task DAG',
    assignedAgent: 'Planner',
    status: 'completed',
    priority: 'high',
    outputSnippet: 'Created 4-stage execution plan for microservice deployment.'
  },
  {
    id: 'task-102',
    title: 'Architect: Design Drizzle PostgreSQL schema & ERD',
    assignedAgent: 'Architect',
    status: 'completed',
    priority: 'critical',
    outputSnippet: 'Generated schema with users, projects, and telemetry_logs tables.'
  },
  {
    id: 'task-103',
    title: 'Coder: Synthesize server.ts & REST controller endpoints',
    assignedAgent: 'Coder',
    status: 'in_progress',
    priority: 'critical',
    outputSnippet: 'Synthesizing /api/v1/projects route handler...'
  },
  {
    id: 'task-104',
    title: 'Reviewer: Perform AST security check & linter pass',
    assignedAgent: 'Reviewer',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: 'task-105',
    title: 'Tester: Run automated Vitest suite (100% path coverage)',
    assignedAgent: 'Tester',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: 'task-106',
    title: 'DevOps: Trigger esbuild & Cloud Run revision release',
    assignedAgent: 'DevOps',
    status: 'pending',
    priority: 'high'
  }
];

export const INITIAL_SWARM_TIMELINE: AgentMessage[] = [
  {
    id: 'sw-1',
    agentRole: 'Planner',
    timestamp: '10:14:00 AM',
    thought: 'Analyzing user workspace prompt: "Build multi-tenant authentication microservice with PostgreSQL".',
    content: 'Goal identified: Multi-Tenant Auth API. Breaking down task into 6 agent sub-routines.',
    plan: [
      '1. Architect -> Generate Drizzle Schema & JWT auth middleware',
      '2. Coder -> Implement Express routes (/api/auth/login, /api/auth/register)',
      '3. Reviewer -> Audit token verification & password hashing',
      '4. Tester -> Write Vitest assertions',
      '5. DevOps -> Verify port 3000 binding & Dockerfile'
    ]
  },
  {
    id: 'sw-2',
    agentRole: 'Architect',
    timestamp: '10:14:08 AM',
    thought: 'Drafting Drizzle ORM PostgreSQL schema for multi-tenant isolation.',
    content: 'Schema design complete. Added tenant_id column indexed across all domain entities with foreign key constraints.',
    codeSnippet: `import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';\n\nexport const tenants = pgTable('tenants', {\n  id: uuid('id').primaryKey().defaultRandom(),\n  name: text('name').notNull(),\n  createdAt: timestamp('created_at').defaultNow()\n});`
  },
  {
    id: 'sw-3',
    agentRole: 'Coder',
    timestamp: '10:14:15 AM',
    thought: 'Synthesizing Express.js REST routes with lazy SDK initialization.',
    content: 'Generated Auth router module. All secrets read from process.env with clear fallbacks.',
    codeSnippet: `import { Router } from 'express';\n\nexport const authRouter = Router();\n\nauthRouter.post('/login', async (req, res) => {\n  const { email, password } = req.body;\n  // Token generation logic\n  res.json({ token: 'jwt_mock_token_84a1', tenantId: 't-101' });\n});`
  },
  {
    id: 'sw-4',
    agentRole: 'Reviewer',
    timestamp: '10:14:22 AM',
    thought: 'Performing AST security scan on route handlers.',
    content: 'Security scan passed! Verified 0 explicit any types, 0 unhandled promise rejections, and correct status codes.',
    reviewNotes: 'Verified CORS headers and process.env fallback safety.'
  }
];
