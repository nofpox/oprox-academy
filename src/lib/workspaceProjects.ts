import { VFSNode } from '../types';
import { initialVFSTree } from '../data/initialVFS';

export interface WorkspaceProject {
  id: string;
  title: string;
  description: string;
  category: string;
  updatedAt: string;
  icon: string;
  vfsNodes: VFSNode[];
  activeFilePath?: string;
  createdAt: string;
}

// In-Memory store for workspace projects (fallback when PostgreSQL table is optional/in-memory)
const projectsStore = new Map<string, WorkspaceProject>();

// Pre-populate standard projects
const DEFAULT_PROJECTS: WorkspaceProject[] = [
  {
    id: 'proj_1',
    title: 'OPROX Enterprise Core',
    description: 'Autonomous AI Software Engineering OS with 18-stage pipeline, multi-agent engine, and real-time VFS',
    category: 'Enterprise Core',
    updatedAt: new Date().toISOString(),
    icon: '⚡',
    vfsNodes: initialVFSTree,
    activeFilePath: '/src/App.tsx',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj_2',
    title: 'Aethel Multi-Tenant Auth API',
    description: 'High-performance REST API with JWT Auth, Rate Limiting middleware, and Postgres schema',
    category: 'Backend REST',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    icon: '🔐',
    vfsNodes: [
      ...initialVFSTree,
      {
        id: 'file-auth-api',
        name: 'authMiddleware.ts',
        type: 'file',
        path: '/src/middleware/authMiddleware.ts',
        language: 'typescript',
        content: `// Aethel Multi-Tenant JWT Auth Middleware\nimport { Request, Response, NextFunction } from 'express';\n\nexport function verifyAethelToken(req: Request, res: Response, next: NextFunction) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'Unauthorized: Missing JWT Token' });\n  next();\n}`,
      },
    ],
    activeFilePath: '/src/middleware/authMiddleware.ts',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'proj_3',
    title: 'PropTech Lease & Rent Portal',
    description: 'Smart tenant access portal with rent collection analytics and maintenance AI triage',
    category: 'PropTech OS',
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    icon: '🏢',
    vfsNodes: initialVFSTree,
    activeFilePath: '/src/App.tsx',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'proj_4',
    title: 'Media Studio 4K Storyboard Generator',
    description: 'AI Video Storyboard generator for Media Studio with 4K asset rendering pipeline',
    category: 'Media AI',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    icon: '🎬',
    vfsNodes: initialVFSTree,
    activeFilePath: '/src/App.tsx',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

// Initialize default projects in map
for (const proj of DEFAULT_PROJECTS) {
  projectsStore.set(proj.id, proj);
}

export async function getAllWorkspaceProjects(): Promise<WorkspaceProject[]> {
  return Array.from(projectsStore.values());
}

export async function getWorkspaceProjectById(id: string): Promise<WorkspaceProject | null> {
  return projectsStore.get(id) || null;
}

export async function createWorkspaceProject(data: {
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  vfsNodes?: VFSNode[];
}): Promise<WorkspaceProject> {
  const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newProj: WorkspaceProject = {
    id,
    title: data.title,
    description: data.description || 'Custom OPROX Workspace Project',
    category: data.category || 'Custom App',
    updatedAt: new Date().toISOString(),
    icon: data.icon || '🚀',
    vfsNodes: data.vfsNodes || initialVFSTree,
    activeFilePath: '/src/App.tsx',
    createdAt: new Date().toISOString(),
  };

  projectsStore.set(id, newProj);
  return newProj;
}

export async function updateWorkspaceProject(
  id: string,
  updates: Partial<WorkspaceProject>
): Promise<WorkspaceProject> {
  const existing = projectsStore.get(id);
  if (!existing) {
    throw new Error(`Workspace project with id '${id}' not found.`);
  }

  const updated: WorkspaceProject = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  projectsStore.set(id, updated);
  return updated;
}

export async function deleteWorkspaceProject(id: string): Promise<{ success: boolean }> {
  const deleted = projectsStore.delete(id);
  return { success: deleted };
}
