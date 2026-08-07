// OPROX Phase 11 — Navigation Structure & Route Mapping

import { AppMode } from '../types';
import { RouteDefinition, NavigationBreadcrumb } from './types';

export const OPROX_ROUTES: RouteDefinition[] = [
  {
    path: '/',
    mode: 'dashboard',
    category: 'Core Navigation',
    label: 'Command Dashboard',
    description: 'Executive system overview, KPI metrics, and real-time engine telemetry.',
    iconName: 'LayoutDashboard',
    requiresAuth: false
  },
  {
    path: '/ai-os',
    mode: 'ai-os',
    category: 'Intelligence & Swarm',
    label: 'Autonomous AI Swarm',
    description: 'Multi-agent orchestration, context memory, and prompt synthesis engine.',
    iconName: 'Bot',
    requiresAuth: false
  },
  {
    path: '/solutions',
    mode: 'solutions',
    category: 'Vertical Marketplace',
    label: 'Industry Solutions',
    description: 'Turnkey enterprise applications and vertical domain suites.',
    iconName: 'Building2',
    requiresAuth: false
  },
  {
    path: '/academy',
    mode: 'academy',
    category: 'Education & Learning',
    label: 'OPROX Academy',
    description: 'Technical course catalog, structured learning paths, and certifications.',
    iconName: 'GraduationCap',
    requiresAuth: false
  },
  {
    path: '/platform-suite',
    mode: 'platform-suite',
    category: 'Platform Operations',
    label: 'Platform Hub (33 Pages)',
    description: '33 specialized sub-pages for admin, security, DevOps, and cloud infrastructure.',
    iconName: 'Layers',
    requiresAuth: false
  },
  {
    path: '/ide',
    mode: 'ide',
    category: 'Engineering',
    label: 'Cloud IDE Engine',
    description: 'Full-stack online code editor, virtual file system, and automated bundler.',
    iconName: 'Code2',
    requiresAuth: false
  },
  {
    path: '/database',
    mode: 'database',
    category: 'Data Infrastructure',
    label: 'Database Studio',
    description: 'Visual query builder, schema migration engine, and vector memory store.',
    iconName: 'Database',
    requiresAuth: false
  },
  {
    path: '/cloud',
    mode: 'cloud',
    category: 'Cloud Infrastructure',
    label: 'Cloud & Network Monitors',
    description: 'Serverless deployment clusters, edge routing, and cloud metrics.',
    iconName: 'Server',
    requiresAuth: false
  },
  {
    path: '/enterprise',
    mode: 'enterprise',
    category: 'Enterprise Governance',
    label: 'Enterprise Memory OS',
    description: 'Role-based access control, audit logs, compliance policies, and SSO.',
    iconName: 'ShieldCheck',
    requiresAuth: false
  },
  {
    path: '/media',
    mode: 'media',
    category: 'Creative Verticals',
    label: 'Media Studio',
    description: 'Autonomous video rendering pipeline, 3D frame compositor, and audio synthesis.',
    iconName: 'Film',
    requiresAuth: false
  },
  {
    path: '/proptech',
    mode: 'proptech',
    category: 'Real Estate Verticals',
    label: 'PropTech Analytics',
    description: 'Smart building telemetry, tenant portals, and lease yield calculators.',
    iconName: 'Building',
    requiresAuth: false
  },
  {
    path: '/showcase',
    mode: 'showcase',
    category: 'Interactive Showcase',
    label: 'Feature Showcase',
    description: 'Interactive demonstration of all core capabilities and engine modules.',
    iconName: 'Sparkles',
    requiresAuth: false
  },
  {
    path: '/design-system',
    mode: 'design-system',
    category: 'System Design',
    label: 'OPROX Design Tokens',
    description: 'Component library, color palettes, typography specs, and micro-interactions.',
    iconName: 'Palette',
    requiresAuth: false
  }
];

export function getRouteByMode(mode: AppMode): RouteDefinition {
  return OPROX_ROUTES.find((r) => r.mode === mode) || OPROX_ROUTES[0];
}

export function getBreadcrumbs(mode: AppMode, activeSubpageLabel?: string): NavigationBreadcrumb[] {
  const route = getRouteByMode(mode);
  const breadcrumbs: NavigationBreadcrumb[] = [
    {
      id: 'root',
      label: 'OPROX Core',
      path: '/',
      mode: 'dashboard',
      active: mode === 'dashboard' && !activeSubpageLabel
    }
  ];

  if (mode !== 'dashboard') {
    breadcrumbs.push({
      id: route.mode,
      label: route.label,
      path: route.path,
      mode: route.mode,
      active: !activeSubpageLabel
    });
  }

  if (activeSubpageLabel) {
    breadcrumbs.push({
      id: 'subpage',
      label: activeSubpageLabel,
      path: `${route.path}?subpage=${encodeURIComponent(activeSubpageLabel)}`,
      mode: route.mode,
      active: true
    });
  }

  return breadcrumbs;
}
