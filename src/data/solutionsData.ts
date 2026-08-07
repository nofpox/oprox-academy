import { IndustrySolution, SolutionCategory, SolutionActivityLog, SolutionPermission, BillingSummary } from '../types';

export const SOLUTION_CATEGORIES: SolutionCategory[] = [
  'Media & Content',
  'Real Estate & PropTech',
  'Property Management',
  'Enterprise ERP',
  'FinTech & Billing',
  'AI & Automation',
  'Developer Tools'
];

export const MOCK_SOLUTIONS: IndustrySolution[] = [
  {
    id: 'sol-media-studio',
    name: 'OPROX Media Studio',
    tagline: 'AI visual storyboarding, 4K prompt synthesizer & video script factory',
    category: 'Media & Content',
    description: 'Autonomous media content creation engine. Generates high-fidelity visual assets, 4K render prompts, marketing copy, and multi-scene video storyboards in seconds.',
    iconName: 'Film',
    version: 'v3.8.2',
    rating: 4.9,
    installCount: 14200,
    isFeatured: true,
    isInstalled: true,
    activeUsers: 340,
    monthlySavings: '$12,400',
    status: 'Active',
    tags: ['Generative AI', 'Storyboarding', 'Gemini Flash', 'Video Scripting'],
    bannerGradient: 'from-pink-600 via-purple-600 to-indigo-700'
  },
  {
    id: 'sol-real-estate',
    name: 'OPROX Real Estate Studio',
    tagline: 'Property portfolio management, lease analytics & AI yield forecasting',
    category: 'Real Estate & PropTech',
    description: 'Comprehensive commercial & residential real estate intelligence. Multi-property NOI yield forecasting, cap rate calculation, and automated lease milestone tracking.',
    iconName: 'Building2',
    version: 'v2.4.0',
    rating: 4.8,
    installCount: 8900,
    isFeatured: true,
    isInstalled: true,
    activeUsers: 185,
    monthlySavings: '$18,900',
    status: 'Active',
    tags: ['PropTech', 'Cap Rate Yield', 'Lease Automation', 'Portfolio Analytics'],
    bannerGradient: 'from-cyan-600 via-teal-600 to-emerald-700'
  },
  {
    id: 'sol-prop-management',
    name: 'OPROX Property Management',
    tagline: 'Automated tenant portal, IoT work orders & maintenance dispatch',
    category: 'Property Management',
    description: 'Smart building operations system. Direct tenant communication, IoT sensor health monitoring, automated maintenance work order dispatch, and rent collection logs.',
    iconName: 'Key',
    version: 'v1.9.5',
    rating: 4.7,
    installCount: 6400,
    isFeatured: true,
    isInstalled: true,
    activeUsers: 120,
    monthlySavings: '$9,300',
    status: 'Active',
    tags: ['Tenant Portal', 'IoT Work Orders', 'Smart Facility', 'Rent Collection'],
    bannerGradient: 'from-emerald-600 via-teal-600 to-cyan-700'
  },
  {
    id: 'sol-enterprise-erp',
    name: 'OPROX Enterprise ERP',
    tagline: 'Multi-tenant organization ledger, audit trails & HR sync',
    category: 'Enterprise ERP',
    description: 'Centralized enterprise operating ledger with SOC2 compliance auditing, automated SAP/Salesforce sync, and cross-departmental RBAC security controls.',
    iconName: 'ShieldCheck',
    version: 'v4.1.0',
    rating: 4.9,
    installCount: 11300,
    isFeatured: true,
    isInstalled: true,
    activeUsers: 510,
    monthlySavings: '$34,000',
    status: 'Active',
    tags: ['SOC2 Auditing', 'Multi-Tenant', 'RBAC Security', 'Enterprise ERP'],
    bannerGradient: 'from-blue-600 via-indigo-600 to-purple-700'
  },
  {
    id: 'sol-fintech-billing',
    name: 'OPROX FinTech Billing Engine',
    tagline: 'Usage-based Stripe metering, multi-currency revenue & invoices',
    category: 'FinTech & Billing',
    description: 'High-throughput API token billing metering. Handles metered subscriptions, multi-currency invoicing, tax compliance, and automatic churn prediction alerts.',
    iconName: 'CreditCard',
    version: 'v2.1.2',
    rating: 4.8,
    installCount: 9700,
    isFeatured: false,
    isInstalled: false,
    activeUsers: 0,
    monthlySavings: '$15,200',
    status: 'Available',
    tags: ['Stripe Metering', 'Usage Billing', 'Invoicing', 'Tax Compliance'],
    bannerGradient: 'from-amber-600 via-orange-600 to-red-700'
  },
  {
    id: 'sol-ai-agents',
    name: 'OPROX Autonomous AI Swarm',
    tagline: 'Multi-agent developer factory for AST code generation & testing',
    category: 'AI & Automation',
    description: '6-agent orchestration swarm that plans, designs schemas, synthesizes TypeScript code, executes Vitest suites, and deploys to Cloud Run in 15 seconds.',
    iconName: 'Bot',
    version: 'v5.0.0',
    rating: 5.0,
    installCount: 22100,
    isFeatured: true,
    isInstalled: true,
    activeUsers: 840,
    monthlySavings: '$45,000',
    status: 'Active',
    tags: ['Multi-Agent', 'AST Code Gen', 'Vitest Automation', 'Cloud Run'],
    bannerGradient: 'from-emerald-500 via-teal-500 to-indigo-600'
  },
  {
    id: 'sol-db-studio',
    name: 'OPROX DB Schema Studio',
    tagline: 'Visual Drizzle PostgreSQL ERD designer & SQL migration runner',
    category: 'Developer Tools',
    description: 'Interactive relational database modeling tool. Auto-generates Drizzle ORM schemas, foreign key cascade rules, and executes zero-downtime migrations.',
    iconName: 'Database',
    version: 'v3.0.1',
    rating: 4.8,
    installCount: 15800,
    isFeatured: false,
    isInstalled: true,
    activeUsers: 290,
    monthlySavings: '$8,100',
    status: 'Active',
    tags: ['PostgreSQL', 'Drizzle ORM', 'Schema ERD', 'Migrations'],
    bannerGradient: 'from-violet-600 via-purple-600 to-indigo-700'
  }
];

export const MOCK_ACTIVITY_LOGS: SolutionActivityLog[] = [
  {
    id: 'act-1',
    solutionId: 'sol-media-studio',
    action: 'Generated 4K 8-Scene Video Storyboard for Product Reveal',
    user: 'Sarah Connor (Lead Designer)',
    timestamp: '2 mins ago',
    status: 'success'
  },
  {
    id: 'act-2',
    solutionId: 'sol-real-estate',
    action: 'Recalculated Cap Rate Yield for Grand Central Tower (6.8%)',
    user: 'Alex Rivera (Portfolio Manager)',
    timestamp: '14 mins ago',
    status: 'info'
  },
  {
    id: 'act-3',
    solutionId: 'sol-prop-management',
    action: 'Dispatched Maintenance Work Order #402 (HVAC Filter Replacement)',
    user: 'Automated IoT Sensor #12',
    timestamp: '32 mins ago',
    status: 'warning'
  },
  {
    id: 'act-4',
    solutionId: 'sol-ai-agents',
    action: 'Planner & Architect Swarm synthesized Express + Drizzle API router',
    user: 'OPROX Swarm Orchestrator',
    timestamp: '45 mins ago',
    status: 'success'
  },
  {
    id: 'act-5',
    solutionId: 'sol-enterprise-erp',
    action: 'Completed quarterly SOC2 compliance log backup & encrypted upload',
    user: 'System Cron Worker',
    timestamp: '1 hour ago',
    status: 'success'
  }
];

export const MOCK_PERMISSIONS: SolutionPermission[] = [
  {
    id: 'perm-admin',
    role: 'Admin',
    permissions: [
      'Install & uninstall solutions',
      'Manage API keys & webhooks',
      'Configure RBAC roles & members',
      'Access billing & usage reports',
      'Execute database schema migrations'
    ]
  },
  {
    id: 'perm-dev',
    role: 'Developer',
    permissions: [
      'Launch & execute installed solutions',
      'Synthesize media assets & prompt specs',
      'Query database studio schema',
      'Trigger AI swarm routines'
    ]
  },
  {
    id: 'perm-mgr',
    role: 'Manager',
    permissions: [
      'View property portfolio metrics',
      'Approve maintenance work orders',
      'Export financial yield reports',
      'Monitor active user seats'
    ]
  },
  {
    id: 'perm-viewer',
    role: 'Viewer',
    permissions: [
      'Read-only access to Solution Dashboard',
      'Inspect activity logs & telemetry cards'
    ]
  }
];

export const MOCK_BILLING_SUMMARY: BillingSummary = {
  planName: 'OPROX Enterprise Ultimate Tier',
  monthlyQuotaTokens: '50,000,000',
  usedTokensPercent: 34,
  storageUsedGB: 184,
  storageMaxGB: 1000,
  activeSeats: 24,
  maxSeats: 50,
  nextBillingDate: 'August 15, 2026',
  estimatedCost: '$1,450 / month'
};
