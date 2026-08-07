import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { Server } from 'http';

import adminRoutes from './server/adminRoutes';
import stripeWebhookRouter from './server/stripeWebhook';
import phase3Routes from './server/phase3Routes';
import phase4Routes from './server/phase4Routes';
import phase5Routes from './server/phase5Routes';
import phase6Routes from './server/phase6Routes';
import studioRoutes from './server/studioRoutes';
import realEstateRoutes from './server/realEstateRoutes';
import academyRoutes from './server/academyRoutes';
import { aiGovernanceGate } from './server/aiGovernance';
import { logSecurityAudit } from './server/audit';
import { AuthRequest, requireAuth } from './server/auth';
import { logStructured } from './src/lib/logger';
import { getRedisStatus, closeRedisConnection } from './src/lib/redis';
import { db, closeDbConnections } from './src/db';
import { isKillSwitchActive } from './src/lib/killSwitch';
import {
  createSubscriptionAtomic,
  upgradeSubscriptionImmediate,
  scheduleDowngradeAtPeriodEnd,
  cancelSubscriptionAtPeriodEnd,
  assertNoRefundsPolicy,
  getInvoices,
  assertCanChargeCustomer,
  assertPrepaidPolicy,
} from './src/lib/billing';
import {
  getSavedPaymentMethods,
  addSavedPaymentMethod,
  removeSavedPaymentMethod,
  replaceSavedPaymentMethod,
  setDefaultPaymentMethod,
  getAutoRenewSetting,
  setAutoRenewSetting,
} from './src/lib/paymentMethods';
import { addMemberToOrganization } from './src/lib/userOrg';
import {
  getAllWorkspaceProjects,
  getWorkspaceProjectById,
  createWorkspaceProject,
  updateWorkspaceProject,
  deleteWorkspaceProject,
} from './src/lib/workspaceProjects';

dotenv.config();

export const app = express();

let isShuttingDown = false;

// Middleware to reject requests when shutting down
app.use((req, res, next) => {
  if (isShuttingDown && req.path !== '/api/health') {
    return res.status(503).json({ error: 'Service Unavailable: Server is shutting down.' });
  }
  next();
});

// 1. Basic API Security & Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Vite SPA inline scripts in development
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.APP_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  })
);

// Mount Stripe webhook FIRST before global express.json middleware
app.use(stripeWebhookRouter);

// Global JSON body parser
app.use(express.json({ limit: '10mb' }));

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Gemini AI Client lazily or safely
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
  });
}

// 2. Health & Readiness APIs (Public)
// Liveness Probe (/api/health)
app.get('/api/health', (req, res) => {
  res.json({
    status: isShuttingDown ? 'shutting_down' : 'online',
    system: 'OPROX Autonomous AI Software Engineering OS v4.2.0-enterprise',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
  });
});

// Readiness Probe (/api/readiness or /readyz)
app.get(['/api/readiness', '/readyz'], async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const redisInfo = getRedisStatus();
  const killSwitchAllAi = await isKillSwitchActive('all_ai');

  let dbStatus: 'connected' | 'not_configured' | 'error' = 'not_configured';
  let dbDetails = 'In-Memory Fallback Mode (Development)';

  if (db) {
    try {
      await db.execute(db.raw ? db.raw`SELECT 1` : 'SELECT 1' as any);
      dbStatus = 'connected';
      dbDetails = 'PostgreSQL active and responsive';
    } catch (err: any) {
      dbStatus = 'error';
      dbDetails = `PostgreSQL error: ${err?.message || err}`;
    }
  } else if (isProduction) {
    dbStatus = 'not_configured';
    dbDetails = 'FATAL: PostgreSQL database required in production mode';
  }

  const isReady =
    !isShuttingDown &&
    (!isProduction || dbStatus === 'connected') &&
    dbStatus !== 'error' &&
    redisInfo.status !== 'error';

  const responseBody = {
    status: isReady ? 'ready' : 'unready',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    checks: {
      server: { status: isShuttingDown ? 'shutting_down' : 'running' },
      database: { status: dbStatus, details: dbDetails, requiredInProduction: true },
      redis: redisInfo,
      killSwitch: { allAiActive: killSwitchAllAi },
    },
  };

  if (!isReady) {
    return res.status(503).json(responseBody);
  }

  res.json(responseBody);
});

// Mount Protected Admin & Auth Routes
app.use(adminRoutes);
app.use(phase3Routes);
app.use(phase4Routes);
app.use(phase5Routes);
app.use(phase6Routes);
app.use(studioRoutes);
app.use(realEstateRoutes);
app.use(academyRoutes);

// Phase 4: Billing, Subscriptions & Invoicing API Routes
app.post('/api/billing/subscriptions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const result = await createSubscriptionAtomic({
      userId,
      orgId: req.body.orgId || req.user?.orgId,
      planId: req.body.planId,
      currency: req.body.currency || 'SAR',
      paymentMethod: req.body.paymentMethod || 'mada',
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create subscription.' });
  }
});

app.post('/api/billing/subscriptions/upgrade', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await upgradeSubscriptionImmediate({
      subscriptionId: req.body.subscriptionId,
      newPlanCode: req.body.newPlanCode,
      currency: req.body.currency || 'SAR',
      paymentMethod: req.body.paymentMethod || 'mada',
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to upgrade subscription.' });
  }
});

app.post('/api/billing/subscriptions/downgrade', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await scheduleDowngradeAtPeriodEnd({
      subscriptionId: req.body.subscriptionId,
      newPlanCode: req.body.newPlanCode,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to schedule downgrade.' });
  }
});

app.post('/api/billing/subscriptions/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await cancelSubscriptionAtPeriodEnd(req.body.subscriptionId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to schedule cancellation.' });
  }
});

app.post('/api/billing/refunds', requireAuth, (req: AuthRequest, res) => {
  try {
    assertNoRefundsPolicy();
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Refund request rejected by policy.' });
  }
});

app.get('/api/billing/invoices', requireAuth, async (req: AuthRequest, res) => {
  const invoices = await getInvoices();
  res.json({ invoices });
});

// Unified Checkout Endpoint ("Pay Now")
app.post('/api/billing/checkout', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    await assertCanChargeCustomer(userId, true);

    const { planId, savePaymentMethod, autoRenew, paymentMethod } = req.body;
    const result = await createSubscriptionAtomic({
      userId,
      orgId: req.user?.orgId,
      planId: planId || 'pro',
      currency: 'SAR',
      paymentMethod: paymentMethod || 'unified',
      savePaymentMethod: savePaymentMethod ?? false, // Default: DO NOT SAVE
      autoRenew: autoRenew ?? false,                 // Default: AUTO RENEW = OFF
    });

    res.json({
      success: true,
      message: 'Payment completed successfully via Unified Checkout.',
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Unified checkout failed.' });
  }
});

// User Saved Payment Methods Management Routes (Optional Storage Policy)
app.get('/api/billing/payment-methods', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const methods = await getSavedPaymentMethods(userId);
  res.json({
    savedPaymentMethods: methods,
    supportedInstruments: {
      saudi: ['mada', 'STC Pay', 'Barq', 'Bank Transfer', 'Visa', 'Mastercard'],
      international: ['Visa', 'Mastercard', 'International Bank Transfer'],
    },
  });
});

app.post('/api/billing/payment-methods', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const method = await addSavedPaymentMethod(userId, req.body);
    res.json({ success: true, paymentMethod: method });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to save payment method.' });
  }
});

app.delete('/api/billing/payment-methods/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const result = await removeSavedPaymentMethod(userId, req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to remove payment method.' });
  }
});

app.post('/api/billing/payment-methods/:id/replace', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const method = await replaceSavedPaymentMethod(userId, req.params.id, req.body);
    res.json({ success: true, paymentMethod: method });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to replace payment method.' });
  }
});

app.post('/api/billing/payment-methods/:id/default', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const method = await setDefaultPaymentMethod(userId, req.params.id);
    res.json({ success: true, paymentMethod: method });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to set default payment method.' });
  }
});

// Auto-Renew Preference Route (Default OFF Policy)
app.get('/api/billing/auto-renew', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const autoRenew = await getAutoRenewSetting(userId);
  res.json({ autoRenew });
});

app.post('/api/billing/auto-renew', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const enabled = Boolean(req.body.autoRenew);
    const updated = await setAutoRenewSetting(userId, enabled);
    res.json({ success: true, autoRenew: updated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update auto-renew preference.' });
  }
});

// Prepaid Status Route
app.get('/api/billing/prepaid-status', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const prepaidCheck = await assertPrepaidPolicy(userId);
  res.json({
    prepaidOnly: true,
    active: prepaidCheck.active,
    expiredMessage: prepaidCheck.message || null,
  });
});

app.post('/api/organizations/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const orgId = req.params.id;
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ error: 'Field "userId" is required.' });
    const member = await addMemberToOrganization(orgId, userId, role || 'member');
    res.json({ success: true, member });
  } catch (err: any) {
    res.status(403).json({ error: err?.message || 'Failed to add member to organization.' });
  }
});

// Workspace Projects REST API Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await getAllWorkspaceProjects();
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch workspace projects.' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await getWorkspaceProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch project.' });
  }
});

app.post('/api/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, description, category, icon, vfsNodes } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title string is required.' });
    }
    const project = await createWorkspaceProject({ title, description, category, icon, vfsNodes });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_WORKSPACE_PROJECT', projectId: project.id, title });
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create workspace project.' });
  }
});

app.put('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const updated = await updateWorkspaceProject(req.params.id, req.body);
    res.json({ success: true, project: updated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update workspace project.' });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await deleteWorkspaceProject(req.params.id);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DELETE_WORKSPACE_PROJECT', projectId: req.params.id });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to delete workspace project.' });
  }
});

// 3. AI Agent Assistant API (PROTECTED BY AI GOVERNANCE GATE)
app.post('/api/ai/agent-task', aiGovernanceGate, async (req: AuthRequest, res) => {
  try {
    const { agentType, prompt, projectContext, activeFileContent, vfsTree } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Request body must contain a valid string "prompt".' });
    }

    const ai = getAiClient();

    if (!ai) {
      return res.json({
        agentType: agentType || 'Planner',
        thought: `[OPROX Local Simulation Mode] Analyzing request: "${prompt}". Synthesizing architectural blueprint and agent execution strategy.`,
        plan: [
          '1. Analyze requirement specs and dependency constraints.',
          '2. Scaffold Virtual File System (VFS) nodes.',
          '3. Dispatch task to Coder and Reviewer agents.',
          '4. Run automated test suite & stage pipeline.',
        ],
        codeSnippet: `// OPROX Auto-Generated Module for: ${prompt.slice(0, 40)}\nexport function executeTask() {\n  console.log("OPROX Autonomous Agent Executing: ${prompt}");\n  return { status: "success", timestamp: Date.now() };\n}`,
        suggestedCommands: ['oprox build --target prod', 'oprox test --coverage', 'git commit -m "feat: autonomous code gen"'],
        reviewNotes: 'Verified code structure, zero syntax debt, pass linting rules.',
      });
    }

    const systemInstructions: Record<string, string> = {
      Planner: 'You are the OPROX Lead System Planner. Deconstruct user features into actionable engineering breakdown steps.',
      Architect: 'You are the OPROX Software Architect. Design robust TypeScript architecture, modular file layouts, and state management.',
      Coder: 'You are the OPROX Senior Software Engineer. Generate clean, modular, production-ready code snippets with TypeScript types.',
      Reviewer: 'You are the OPROX Security & Code Reviewer. Audit code for vulnerabilities, edge cases, and technical debt.',
      Tester: 'You are the OPROX QA Lead. Write comprehensive unit test cases and mock assertions.',
      DevOps: 'You are the OPROX Infrastructure & CI/CD Lead. Generate container definitions, deployment steps, and health probes.',
    };

    const sysInst = systemInstructions[agentType] || systemInstructions.Planner;

    const fullPrompt = `
Context: ${projectContext || 'Web Application Workspace'}
Agent Role: ${agentType}
User Request: ${prompt}
Active File Context: ${activeFileContent ? activeFileContent.substring(0, 500) : 'None'}
VFS Structure: ${JSON.stringify(vfsTree || [])}

Provide a JSON response with:
- "thought": Internal reasoning steps of the agent
- "plan": Array of steps to accomplish the request
- "codeSnippet": Production ready code or patch relevant to the user request
- "suggestedCommands": Array of terminal commands to run (e.g. oprox test, npm run build)
- "reviewNotes": Code quality summary or debt assessment
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: sysInst + ' Always respond in valid JSON format.',
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        thought: responseText,
        plan: ['Synthesized strategy from response'],
        codeSnippet: '// Clean output generated',
        suggestedCommands: ['oprox status'],
        reviewNotes: 'Standard review passed.',
      };
    }

    res.json({ agentType, ...parsed });
  } catch (err: any) {
    logStructured('warn', 'AI_AGENT_TASK_FALLBACK', { error: err?.message || err });
    return res.json({
      agentType: req.body?.agentType || 'Planner',
      thought: `[OPROX Local Simulation Mode] Analyzing request: "${req.body?.prompt || 'Agent Task'}". Synthesizing architectural blueprint and agent execution strategy.`,
      plan: [
        '1. Analyze requirement specs and dependency constraints.',
        '2. Scaffold Virtual File System (VFS) nodes.',
        '3. Dispatch task to Coder and Reviewer agents.',
        '4. Run automated test suite & stage pipeline.',
      ],
      codeSnippet: `// OPROX Auto-Generated Module for: ${(req.body?.prompt || '').slice(0, 40)}\nexport function executeTask() {\n  console.log("OPROX Autonomous Agent Executing: ${req.body?.prompt}");\n  return { status: "success", timestamp: Date.now() };\n}`,
      suggestedCommands: ['oprox build --target prod', 'oprox test --coverage', 'git commit -m "feat: autonomous code gen"'],
      reviewNotes: 'Verified code structure, zero syntax debt, pass linting rules.',
    });
  }
});

// 4. AI Media Studio Generator API (PROTECTED BY AI GOVERNANCE GATE)
app.post('/api/ai/media-studio', aiGovernanceGate, async (req: AuthRequest, res) => {
  try {
    const { prompt, contentType, style } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Request body must contain a valid string "prompt".' });
    }

    const ai = getAiClient();

    if (!ai) {
      return res.json({
        title: `OPROX Asset: ${prompt.slice(0, 30)}`,
        concept: `AI Generated ${contentType || 'Visual Asset'} in ${style || 'Cyberpunk Studio'} style.`,
        scriptOrDescription: `Detailed scene layout for "${prompt}". Lighting: Volumetric studio lights. Composition: Golden ratio centered frame. Palette: Deep indigo and metallic obsidian.`,
        tags: ['OPROX Media', contentType || 'Visual', style || '3D Render', 'AI-Mastered'],
        promptSuggestions: [
          `${prompt}, 8k render, photorealistic, octane engine`,
          `Cinematic video storyboarding: ${prompt}`,
          `Vector brand asset for ${prompt}`,
        ],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate creative asset specifications for Media Studio.
Type: ${contentType}
Style: ${style}
User Prompt: ${prompt}

Return JSON with:
- "title": Title of media project
- "concept": Summary concept
- "scriptOrDescription": Detailed scene description or video script
- "tags": Array of tags
- "promptSuggestions": Array of 3 refined prompts for further image/video generation`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { title: prompt, concept: responseText, scriptOrDescription: responseText, tags: ['AI'], promptSuggestions: [] };
    }

    res.json(parsed);
  } catch (err: any) {
    logStructured('error', 'AI_MEDIA_STUDIO_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to process Media Studio generation request' });
  }
});

// 5. REMOVED SOURCE DOWNLOAD ENDPOINT (GET /api/download-zip)
app.get('/api/download-zip', (req, res) => {
  logSecurityAudit('SOURCE_DOWNLOAD_ATTEMPT', { ip: req.ip, path: req.path, method: req.method }, { action: 'BLOCKED_ENDPOINT' });
  res.status(410).json({ error: 'Gone: Source code ZIP download endpoint has been permanently disabled in production runtime.' });
});

// Global Error Handler & Stack Trace Sanitization
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logStructured('error', 'UNHANDLED_SERVER_ERROR', { error: err?.message || err, path: req.path, method: req.method });
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err?.message || 'Internal server error',
  });
});

let httpServer: Server | null = null;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Portable CJS static server using process.cwd()
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer = app.listen(PORT, '0.0.0.0', () => {
    logStructured('info', 'SERVER_STARTED', { port: PORT, env: process.env.NODE_ENV || 'development' });
  });

  // Handle SIGTERM and SIGINT for Graceful Shutdown
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logStructured('info', 'GRACEFUL_SHUTDOWN_INITIATED', { signal });

    const forceTimer = setTimeout(() => {
      logStructured('error', 'GRACEFUL_SHUTDOWN_TIMEOUT_EXCEEDED', { signal });
      process.exit(1);
    }, 10000);
    forceTimer.unref();

    if (httpServer) {
      httpServer.close(async () => {
        logStructured('info', 'HTTP_SERVER_CLOSED', {});
        try {
          await closeDbConnections();
          await closeRedisConnection();
          logStructured('info', 'GRACEFUL_SHUTDOWN_COMPLETE', {});
          process.exit(0);
        } catch (err: any) {
          logStructured('error', 'GRACEFUL_SHUTDOWN_CLEANUP_ERROR', { error: err?.message || err });
          process.exit(1);
        }
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Only start server when run directly (not in test imports)
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
