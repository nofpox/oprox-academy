import { VFSNode } from '../types';

export const initialVFSTree: VFSNode[] = [
  {
    id: 'root-pkg',
    name: 'package.json',
    type: 'file',
    path: '/package.json',
    language: 'json',
    content: `{
  "name": "oprox-enterprise-core",
  "version": "4.2.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "tsc && vite build",
    "start": "node dist/server.js",
    "test": "vitest run --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "oprox:agent": "oprox-cli dispatch --agents all"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "express": "^4.21.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3"
  }
}`
  },
  {
    id: 'root-readme',
    name: 'README.md',
    type: 'file',
    path: '/README.md',
    language: 'markdown',
    content: `# OPROX Autonomous AI Software Engineering Platform

OPROX is an autonomous cloud development OS powered by a multi-agent AI team (Planner, Architect, Coder, Reviewer, Tester, DevOps).

## Architecture Highlights
- **Virtual File System (VFS)**: Real-time file sync, AST parsing, and diff previewing.
- **18-Stage Software Factory**: Automated end-to-end pipeline from spec to cloud deployment.
- **Database Studio**: Schema visualization, live SQL querying, and migration safety checks.
- **Enterprise OS**: Reusable design pattern memory, technical debt scanning, and RBAC governance.
`
  },
  {
    id: 'root-server',
    name: 'server.ts',
    type: 'file',
    path: '/server.ts',
    language: 'typescript',
    content: `import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// OPROX Multi-Agent API Router
app.post('/api/orchestrate', async (req, res) => {
  const { prompt, targetAgent } = req.body;
  console.log(\`[OPROX Engine] Dispatching task to agent: \${targetAgent}\`);
  
  res.json({
    status: 'success',
    orchestrationId: 'orch_' + Math.random().toString(36).substring(7),
    agent: targetAgent,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(\`[OPROX Node] Running on port \${PORT}\`);
});`
  },
  {
    id: 'dir-src',
    name: 'src',
    type: 'directory',
    path: '/src',
    children: [
      {
        id: 'file-app',
        name: 'App.tsx',
        type: 'file',
        path: '/src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { Bot, Terminal, Cpu, Database, Cloud } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <header className="flex justify-between items-center pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
          OPROX Autonomous Application
        </h1>
        <div className="flex gap-2">
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            System Operational
          </span>
        </div>
      </header>
    </div>
  );
}`
      },
      {
        id: 'dir-services',
        name: 'services',
        type: 'directory',
        path: '/src/services',
        children: [
          {
            id: 'file-ai-agent',
            name: 'aiAgentService.ts',
            type: 'file',
            path: '/src/services/aiAgentService.ts',
            language: 'typescript',
            content: `export interface AgentTaskRequest {
  agentRole: 'Planner' | 'Architect' | 'Coder' | 'Reviewer' | 'Tester' | 'DevOps';
  prompt: string;
}

export async function dispatchTaskToAgent(request: AgentTaskRequest) {
  const response = await fetch('/api/ai/agent-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return response.json();
}`
          }
        ]
      },
      {
        id: 'dir-components',
        name: 'components',
        type: 'directory',
        path: '/src/components',
        children: [
          {
            id: 'file-dash',
            name: 'MetricsDashboard.tsx',
            type: 'file',
            path: '/src/components/MetricsDashboard.tsx',
            language: 'typescript',
            content: `import React from 'react';

export const MetricsDashboard: React.FC = () => {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
      <h3 className="text-sm font-semibold text-slate-300">System Throughput</h3>
      <p className="text-2xl font-bold text-white mt-1">1,480 req/sec</p>
    </div>
  );
};`
          }
        ]
      }
    ]
  },
  {
    id: 'dir-db',
    name: 'db',
    type: 'directory',
    path: '/db',
    children: [
      {
        id: 'file-sql-schema',
        name: 'schema.sql',
        type: 'file',
        path: '/db/schema.sql',
        language: 'sql',
        content: `-- OPROX Database Schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'developer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  code_debt_score INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
      }
    ]
  },
  {
    id: 'dir-docker',
    name: 'docker',
    type: 'directory',
    path: '/docker',
    children: [
      {
        id: 'file-dockerfile',
        name: 'Dockerfile',
        type: 'file',
        path: '/docker/Dockerfile',
        language: 'dockerfile',
        content: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["node", "dist/server.js"]`
      }
    ]
  }
];
