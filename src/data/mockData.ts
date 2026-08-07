import { Agent, FactoryStage, DBTable, PatternItem, TechDebtItem, PropertyItem, MediaAsset } from '../types';

export const AGENTS: Agent[] = [
  {
    id: 'Planner',
    name: 'OPROX-Planner',
    avatar: '🎯',
    title: 'Lead System Planner',
    color: 'emerald',
    bgLight: 'bg-emerald-500/10',
    borderAccent: 'border-emerald-500/30',
    status: 'idle',
    description: 'Deconstructs high-level business goals into precise feature specifications and roadmap tasks.',
    specialty: 'Requirements Analysis & Agile Task Breakdown',
  },
  {
    id: 'Architect',
    name: 'OPROX-Architect',
    avatar: '📐',
    title: 'Principal Architect',
    color: 'cyan',
    bgLight: 'bg-cyan-500/10',
    borderAccent: 'border-cyan-500/30',
    status: 'idle',
    description: 'Designs scalable system topology, modular state graphs, API contracts, and VFS file trees.',
    specialty: 'System Design, Microservices & Data Modeling',
  },
  {
    id: 'Coder',
    name: 'OPROX-Coder',
    avatar: '⚡',
    title: 'Senior Software Engineer',
    color: 'indigo',
    bgLight: 'bg-indigo-500/10',
    borderAccent: 'border-indigo-500/30',
    status: 'idle',
    description: 'Generates clean, type-safe TypeScript, UI components, and server endpoints in real time.',
    specialty: 'Full-Stack TypeScript, React, Node & Tailwind',
  },
  {
    id: 'Reviewer',
    name: 'OPROX-Reviewer',
    avatar: '🛡️',
    title: 'Security & Quality Auditor',
    color: 'amber',
    bgLight: 'bg-amber-500/10',
    borderAccent: 'border-amber-500/30',
    status: 'idle',
    description: 'Audits generated code for OWASP vulnerabilities, performance bottlenecks, and code smell.',
    specialty: 'Security Auditing, Code Smell & Optimization',
  },
  {
    id: 'Tester',
    name: 'OPROX-Tester',
    avatar: '🧪',
    title: 'Autonomous QA Engineer',
    color: 'violet',
    bgLight: 'bg-violet-500/10',
    borderAccent: 'border-violet-500/30',
    status: 'idle',
    description: 'Writes and executes unit, integration, and contract tests with auto-mocking assertions.',
    specialty: 'Automated Test Suites & Edge Case Coverage',
  },
  {
    id: 'DevOps',
    name: 'OPROX-DevOps',
    avatar: '🚀',
    title: 'Cloud Infrastructure Lead',
    color: 'rose',
    bgLight: 'bg-rose-500/10',
    borderAccent: 'border-rose-500/30',
    status: 'idle',
    description: 'Handles containerization, CI/CD pipelines, SSL provisioning, and zero-downtime releases.',
    specialty: 'Docker, Kubernetes, CI/CD & Telemetry',
  },
];

export const INITIAL_FACTORY_STAGES: FactoryStage[] = [
  { id: 1, name: 'Requirement Analysis', category: 'Planning', status: 'completed', durationMs: 420, logs: ['[SUCCESS] Parsed natural language prompt', '[INFO] Identified 4 core user flows', '[INFO] Generated acceptance criteria matrix'], description: 'Ingests user requirements and translates them into domain specifications.' },
  { id: 2, name: 'Specification Generation', category: 'Planning', status: 'completed', durationMs: 380, logs: ['[SUCCESS] OpenAPI 3.1 spec compiled', '[INFO] GraphQL schema drafted', '[INFO] Data validation contracts finalized'], description: 'Creates formal API contracts and data models.' },
  { id: 3, name: 'Architectural Design', category: 'Planning', status: 'completed', durationMs: 510, logs: ['[SUCCESS] System topology synthesized', '[INFO] Selected layered architecture with clean isolation', '[INFO] Verified non-blocking asynchronous event loop'], description: 'Synthesizes software topology, design patterns, and package dependencies.' },
  { id: 4, name: 'VFS Environment Provisioning', category: 'Synthesis', status: 'completed', durationMs: 290, logs: ['[SUCCESS] Virtual File System initialized', '[INFO] In-memory AST nodes instantiated', '[INFO] File permissions and path indexes mounted'], description: 'Prepares virtual file trees and workspaces in browser/cloud memory.' },
  { id: 5, name: 'Module Scaffolding', category: 'Synthesis', status: 'completed', durationMs: 340, logs: ['[SUCCESS] Scaffolding 8 primary modules', '[INFO] Configured tsconfig.json and vite build matrix', '[INFO] Synced environment variables (.env.example)'], description: 'Creates boilerplate files, directory trees, and project manifest.' },
  { id: 6, name: 'Logic Implementation', category: 'Synthesis', status: 'completed', durationMs: 1250, logs: ['[SUCCESS] Generated 1,420 lines of TypeScript', '[INFO] React 19 functional hooks implemented', '[INFO] Server endpoints mounted at /api/*'], description: 'Multi-agent AI team generates business logic and UI code.' },
  { id: 7, name: 'AI Code Review & Debt Check', category: 'Verification', status: 'completed', durationMs: 480, logs: ['[SUCCESS] Code review passed with 99.4% score', '[INFO] Zero blocking anti-patterns found', '[INFO] Cyclomatic complexity: 3.2 (Optimal)'], description: 'Scans for code quality, cyclomatic complexity, and anti-patterns.' },
  { id: 8, name: 'Static Security Audit', category: 'Verification', status: 'completed', durationMs: 390, logs: ['[SUCCESS] OWASP Top 10 scanner executed', '[INFO] Sanitized SQL inputs verified', '[INFO] XSS prevention headers validated'], description: 'Runs SAST security scanners against injection, XSS, and hardcoded secrets.' },
  { id: 9, name: 'Automated Unit Testing', category: 'Verification', status: 'completed', durationMs: 620, logs: ['[SUCCESS] 24 unit test suites executed', '[INFO] 100% assertions passed', '[INFO] Code coverage: 94.8%'], description: 'Executes automated unit tests against all generated service components.' },
  { id: 10, name: 'Integration & E2E Testing', category: 'Verification', status: 'completed', durationMs: 810, logs: ['[SUCCESS] Simulated browser E2E session', '[INFO] API integration contract verified', '[INFO] Response latency < 45ms'], description: 'Verifies real client-server data flow and user interaction paths.' },
  { id: 11, name: 'DB Schema Migration', category: 'Deployment', status: 'completed', durationMs: 450, logs: ['[SUCCESS] PostgreSQL schema dry-run succeeded', '[INFO] Created 5 relational tables', '[INFO] Foreign key constraints validated'], description: 'Applies database schema changes with zero data loss locks.' },
  { id: 12, name: 'Build & Tree-Shaking', category: 'Deployment', status: 'completed', durationMs: 730, logs: ['[SUCCESS] Bundled application dist folder', '[INFO] Minified CSS & JS chunks (184 KB gzipped)', '[INFO] Tree-shaking eliminated 42 unused modules'], description: 'Bundles assets using esbuild/vite for production optimization.' },
  { id: 13, name: 'Containerization (Docker)', category: 'Deployment', status: 'completed', durationMs: 890, logs: ['[SUCCESS] Built lightweight OCI container image', '[INFO] Multi-stage build size: 48 MB', '[INFO] Non-root execution user assigned'], description: 'Packages application into container image with minimal OS layer.' },
  { id: 14, name: 'Security Compliance Check', category: 'Deployment', status: 'completed', durationMs: 310, logs: ['[SUCCESS] SOC2 & HIPAA baseline compliance pass', '[INFO] TLS 1.3 encryption enforced', '[INFO] Audit logs pipeline connected'], description: 'Ensures compliance with enterprise governance standards.' },
  { id: 15, name: 'Artifact Staging', category: 'Deployment', status: 'completed', durationMs: 220, logs: ['[SUCCESS] Artifact uploaded to OPROX Container Registry', '[INFO] Cryptographic hash signature: sha256:e9a1...'], description: 'Pushes signed artifacts to high-availability storage registry.' },
  { id: 16, name: 'CI/CD Deployment', category: 'Deployment', status: 'completed', durationMs: 940, logs: ['[SUCCESS] Deployed to Cloud Run cluster', '[INFO] Traffic shifted 0% -> 100% smoothly', '[INFO] HTTP/2 & gRPC endpoints live'], description: 'Executes zero-downtime blue/green deployment.' },
  { id: 17, name: 'Runtime Health Probe', category: 'Monitoring', status: 'completed', durationMs: 290, logs: ['[SUCCESS] Live health probe /api/health returned 200 OK', '[INFO] Memory footprint: 64 MB', '[INFO] CPU utilization: 1.2%'], description: 'Pings runtime container endpoints to verify availability.' },
  { id: 18, name: 'Live Release & Telemetry', category: 'Monitoring', status: 'completed', durationMs: 180, logs: ['[SUCCESS] System live on production endpoint', '[INFO] Real-time telemetry dashboard active', '[INFO] OPROX Memory updated with project footprint'], description: 'Promotes app to production and streams operational metrics.' },
];

export const DB_TABLES: DBTable[] = [
  {
    name: 'users',
    description: 'Enterprise user directory and access roles',
    rowCount: 1240,
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true },
      { name: 'email', type: 'VARCHAR(255)', isNullable: false },
      { name: 'full_name', type: 'VARCHAR(100)' },
      { name: 'role', type: 'VARCHAR(50)' },
      { name: 'status', type: 'VARCHAR(20)' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
    sampleData: [
      { id: 'usr_81a2f', email: 'alex.chen@oprox.io', full_name: 'Alex Chen', role: 'System Architect', status: 'Active', created_at: '2026-01-15' },
      { id: 'usr_39b4c', email: 'sara.v@enterprise.com', full_name: 'Sara Vance', role: 'DevOps Lead', status: 'Active', created_at: '2026-02-01' },
      { id: 'usr_77e1d', email: 'm.khalid@proptech.net', full_name: 'Mustafa Khalid', role: 'Domain Expert', status: 'Active', created_at: '2026-03-10' },
    ]
  },
  {
    name: 'projects',
    description: 'Active autonomous software factory projects',
    rowCount: 86,
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true },
      { name: 'title', type: 'VARCHAR(255)', isNullable: false },
      { name: 'framework', type: 'VARCHAR(100)' },
      { name: 'code_debt_score', type: 'INTEGER' },
      { name: 'pipeline_status', type: 'VARCHAR(50)' },
      { name: 'last_deployed_at', type: 'TIMESTAMP' },
    ],
    sampleData: [
      { id: 'prj_01', title: 'OPROX Fintech Core', framework: 'React + Express', code_debt_score: 98, pipeline_status: 'Deployed', last_deployed_at: '2026-07-29' },
      { id: 'prj_02', title: 'Media Studio Pipeline', framework: 'Python + GenAI API', code_debt_score: 95, pipeline_status: 'Building', last_deployed_at: '2026-07-28' },
      { id: 'prj_03', title: 'PropTech Smart Tenant', framework: 'Next.js + Postgres', code_debt_score: 100, pipeline_status: 'Deployed', last_deployed_at: '2026-07-30' },
    ]
  },
  {
    name: 'properties',
    description: 'PropTech domain unit tracking and lease metadata',
    rowCount: 340,
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true },
      { name: 'name', type: 'VARCHAR(255)' },
      { name: 'type', type: 'VARCHAR(50)' },
      { name: 'units', type: 'INTEGER' },
      { name: 'occupancy_rate', type: 'DECIMAL(5,2)' },
      { name: 'monthly_revenue', type: 'DECIMAL(12,2)' },
    ],
    sampleData: [
      { id: 'prop_101', name: 'Nexus Innovation Hub', type: 'Commercial', units: 48, occupancy_rate: 96.5, monthly_revenue: 142000.00 },
      { id: 'prop_102', name: 'Aura Heights Towers', type: 'Residential', units: 120, occupancy_rate: 98.2, monthly_revenue: 285000.00 },
      { id: 'prop_103', name: 'Vanguard Industrial Park', type: 'Industrial', units: 16, occupancy_rate: 100.0, monthly_revenue: 98000.00 },
    ]
  },
  {
    name: 'media_assets',
    description: 'AI Media Studio asset registry',
    rowCount: 512,
    columns: [
      { name: 'id', type: 'UUID', isPrimary: true },
      { name: 'title', type: 'VARCHAR(255)' },
      { name: 'type', type: 'VARCHAR(50)' },
      { name: 'tags', type: 'TEXT' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
    sampleData: [
      { id: 'asset_01', title: 'Cybernetic Corporate Hero Banner', type: 'Image Prompt', tags: 'cyberpunk, 3d, dark-ui', created_at: '2026-07-29' },
      { id: 'asset_02', title: 'PropTech Tenant App Launch Trailer', type: 'Video Script', tags: 'proptech, trailer, 4k', created_at: '2026-07-27' },
    ]
  }
];

export const PATTERN_LIBRARY: PatternItem[] = [
  {
    id: 'pat_01',
    title: 'Server-Side Gemini API Proxy Pattern',
    category: 'Security & AI Integration',
    reusabilityScore: 99,
    timesApplied: 142,
    description: 'Strict server-side route pattern encapsulating secret API keys with standardized JSON output and error propagation.',
    codeTemplate: `// OPROX Pattern: Server-Side AI Proxy
app.post('/api/ai/gen', async (req, res) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: req.body.prompt });
  res.json({ result: response.text });
});`
  },
  {
    id: 'pat_02',
    title: 'Asynchronous Event-Driven Task Bus',
    category: 'System Architecture',
    reusabilityScore: 96,
    timesApplied: 89,
    description: 'Non-blocking task orchestrator powering multi-agent agent collaboration and live terminal streaming.',
    codeTemplate: `// OPROX Pattern: Task Event Bus
class OproxTaskBus extends EventEmitter {
  dispatchAgent(agent: AgentRole, payload: any) {
    this.emit('agent_start', { agent, timestamp: Date.now() });
  }
}`
  },
  {
    id: 'pat_03',
    title: 'Zero-Downtime Blue/Green Cloud Deployment',
    category: 'DevOps & Cloud',
    reusabilityScore: 98,
    timesApplied: 210,
    description: 'Automated Cloud Run container swap with instant health probe verification before traffic shift.',
    codeTemplate: `# OPROX DevOps Deployment Pattern
gcloud run deploy oprox-service --image gcr.io/oprox/core:latest --no-traffic
gcloud run services update-traffic oprox-service --to-latest`
  }
];

export const TECH_DEBT_ITEMS: TechDebtItem[] = [
  {
    id: 'td_01',
    file: '/src/services/aiAgentService.ts',
    severity: 'low',
    title: 'Missing Request Timeout Cancellation',
    description: 'Fetch request in dispatchTaskToAgent does not attach an AbortSignal timeout listener.',
    suggestedFix: 'Wrap fetch call with AbortController and 30s deadline timeout.'
  },
  {
    id: 'td_02',
    file: '/db/schema.sql',
    severity: 'medium',
    title: 'Unindexed Foreign Keys on Projects Table',
    description: 'Querying projects by user_id requires a full table scan without an explicit index.',
    suggestedFix: 'Add statement: CREATE INDEX idx_projects_user_id ON projects(user_id);'
  }
];

export const PROPERTY_ITEMS: PropertyItem[] = [];

export const MEDIA_ASSETS: MediaAsset[] = [
  { id: 'm1', title: 'OPROX Autonomous Developer Keynote', type: 'Video Script', concept: 'Futuristic product reveal highlighting multi-agent code orchestration.', description: 'Opening scene: Neon dark canvas with floating terminal code buffers. Narrator explains 18-stage pipeline.', tags: ['Product Launch', 'AI', '4K Script'], dateCreated: '2026-07-28' },
  { id: 'm2', title: 'Cyberpunk IDE Workspace Mockup', type: 'Image Prompt', concept: 'High-contrast glassmorphism editor UI with live agent node diagrams.', description: 'Dark theme UI background with emerald status glows, sleek typography, and code editor layout.', tags: ['UI Concept', '3D Render', '1080p'], dateCreated: '2026-07-29' },
  { id: 'm3', title: 'Smart PropTech Tenant App Interface', type: 'UI Component', concept: 'Mobile-first tenant access and rent payment experience.', description: 'Keycard access, maintenance request camera uploader, and energy usage telemetry charts.', tags: ['PropTech', 'Mobile UI', 'Figma Spec'], dateCreated: '2026-07-26' },
];
