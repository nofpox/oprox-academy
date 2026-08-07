import express, { Router, Response } from 'express';
import { AuthRequest, requireAuth, requireRole, requireOrgAccess, generateToken, invalidateToken, extractToken } from './auth';
import { setKillSwitch, getKillSwitch, setCostGuard, getCostGuard, getWalletBalance, adjustWallet } from './aiGovernance';
import { adminRateLimiter, authRateLimiter } from './rateLimiters';
import { logSecurityAudit, getAuditLogs } from './audit';
import { getPlansCatalog, getPlanByCode, upsertPlanCatalog } from '../src/lib/plansCatalog';
import { getPaymentMethodsConfig, updatePaymentMethodConfig } from '../src/lib/paymentMethods';
import {
  createDualApprovalRequest,
  getAllDualApprovalRequests,
  getDualApprovalRequestById,
  approveDualApprovalRequest,
  rejectDualApprovalRequest,
} from '../src/lib/dualApproval';
import { getAllModelPricingMetadata, updateModelPricingMetadata } from '../src/lib/modelPricing';

const router = Router();

// Mock users database for Phase 1 Auth
const USERS_DB = [
  { id: 'usr_super', email: 'superadmin@oprox.io', role: 'superadmin' as const, orgId: 'org_core' },
  { id: 'usr_admin', email: 'admin@oprox.io', role: 'admin' as const, orgId: 'org_core' },
  { id: 'usr_user', email: 'user@oprox.io', role: 'user' as const, orgId: 'org_core' },
];

// 1. Authentication Routes
router.post('/api/auth/login', authRateLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Missing email' });
    return res.status(400).json({ error: 'Email address is required.' });
  }

  // Look up user
  const user = USERS_DB.find(u => u.email.toLowerCase() === String(email).toLowerCase());

  if (!user) {
    logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'User not found', email });
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Generate JWT Token
  const token = generateToken(user);

  logSecurityAudit('AUTH_SUCCESS', { ip: req.ip, path: req.path, method: req.method, user }, { email: user.email, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    },
  });
});

router.post('/api/auth/logout', requireAuth, (req: AuthRequest, res: Response) => {
  const token = extractToken(req);
  if (token) {
    invalidateToken(token);
  }
  logSecurityAudit('AUTH_SUCCESS', req, { action: 'LOGOUT' });
  res.json({ message: 'Successfully logged out and session invalidated.' });
});

router.get('/api/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// 2. Admin & System Management Routes (PROTECTED)
router.get('/admin/users', requireAuth, requireRole('admin'), adminRateLimiter, (req: AuthRequest, res: Response) => {
  res.json({ users: USERS_DB });
});

router.get('/admin/killswitch', requireAuth, requireRole('admin'), adminRateLimiter, (req: AuthRequest, res: Response) => {
  res.json({ active: getKillSwitch() });
});

router.post('/admin/killswitch', requireAuth, requireRole('superadmin'), adminRateLimiter, (req: AuthRequest, res: Response) => {
  const { active } = req.body;
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'Field "active" must be a boolean.' });
  }
  setKillSwitch(active);
  logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'SET_KILLSWITCH', active });
  res.json({ success: true, active: getKillSwitch() });
});

router.get('/admin/costguard', requireAuth, requireRole('admin'), adminRateLimiter, (req: AuthRequest, res: Response) => {
  res.json(getCostGuard());
});

router.post('/admin/costguard', requireAuth, requireRole('superadmin'), adminRateLimiter, (req: AuthRequest, res: Response) => {
  const { active, dailyLimitUsd } = req.body;
  if (typeof active !== 'boolean' || typeof dailyLimitUsd !== 'number') {
    return res.status(400).json({ error: 'Invalid parameters for CostGuard configuration.' });
  }
  setCostGuard(active, dailyLimitUsd);
  logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'SET_COSTGUARD', active, dailyLimitUsd });
  res.json({ success: true, ...getCostGuard() });
});

router.get('/admin/ai-wallet/balance', requireAuth, adminRateLimiter, async (req: AuthRequest, res: Response) => {
  const walletId = req.user?.orgId || req.user?.id;
  if (!walletId) {
    return res.status(400).json({ error: 'Missing tenant or user context for wallet balance.' });
  }
  const balanceMicros = await getWalletBalance(walletId);
  res.json({ walletId, balanceMicros, balanceUsd: balanceMicros / 1000000 });
});

router.post('/admin/ai-wallet/adjust', requireAuth, requireRole('superadmin'), adminRateLimiter, async (req: AuthRequest, res: Response) => {
  const { walletId, deltaMicros } = req.body;
  if (!walletId || typeof deltaMicros !== 'number') {
    return res.status(400).json({ error: 'Fields "walletId" and "deltaMicros" are required.' });
  }
  const newBalance = await adjustWallet(walletId, deltaMicros);
  logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'ADJUST_WALLET', walletId, deltaMicros, newBalance });
  res.json({ walletId, balanceMicros: newBalance, balanceUsd: newBalance / 1000000 });
});

// 3. Payment Provider Configuration Route (Redacts Secrets)
router.get('/admin/payment-providers', requireAuth, requireRole('superadmin'), adminRateLimiter, (req: AuthRequest, res: Response) => {
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

  res.json({
    provider: 'stripe',
    status: hasStripeKey ? 'CONFIGURED' : 'NOT CONFIGURED',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'NOT CONFIGURED',
    secretKey: hasStripeKey ? '[REDACTED]' : 'NOT CONFIGURED',
    webhookSecret: hasWebhookSecret ? '[REDACTED]' : 'NOT CONFIGURED',
  });
});

// 4. Security Audit Logs Endpoint
router.get('/admin/audit-logs', requireAuth, requireRole('admin'), adminRateLimiter, (req: AuthRequest, res: Response) => {
  res.json({ auditLogs: getAuditLogs() });
});

// 5. Tenant Organization Access Gate Route
router.get('/admin/organizations/:orgId', requireAuth, requireRole('admin'), requireOrgAccess, adminRateLimiter, (req: AuthRequest, res: Response) => {
  const { orgId } = req.params;
  res.json({
    orgId,
    name: orgId === 'org_core' ? 'OPROX Core Organization' : 'OPROX Default Organization',
    membersCount: 5,
    status: 'ACTIVE',
  });
});

// 6. Phase 4: Pricing Catalog Endpoints
router.get('/admin/plans', requireAuth, adminRateLimiter, async (req: AuthRequest, res: Response) => {
  const catalog = await getPlansCatalog();
  res.json({ catalog });
});

router.post('/admin/plans', requireAuth, requireRole('superadmin'), adminRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await upsertPlanCatalog(req.body);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'UPSERT_PLAN_CATALOG', planCode: plan.code });
    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to upsert plan.' });
  }
});

// 7. Phase 4: Payment Provider Abstraction & Payment Methods Config
router.get('/admin/payment-methods', requireAuth, adminRateLimiter, async (req: AuthRequest, res: Response) => {
  const methods = await getPaymentMethodsConfig();
  res.json({ methods });
});

router.post('/admin/payment-methods/:id', requireAuth, requireRole('superadmin'), adminRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === 'credit_card' && req.body.enabled === true) {
      return res.status(403).json({ error: 'Credit card payment method cannot be enabled per OPROX commercial policy.' });
    }
    const updated = await updatePaymentMethodConfig(id, req.body);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'UPDATE_PAYMENT_METHOD_CONFIG', id, enabled: updated.enabled });
    res.json({ success: true, method: updated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update payment method.' });
  }
});

// 8. Phase 4: Dual Financial Approval Endpoints
router.get('/admin/dual-approvals', requireAuth, requireRole('admin'), adminRateLimiter, async (req: AuthRequest, res: Response) => {
  const requests = await getAllDualApprovalRequests();
  res.json({ requests });
});

router.post('/admin/dual-approvals', requireAuth, requireRole('superadmin'), adminRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const request = await createDualApprovalRequest({
      actionType: req.body.actionType || 'SENSITIVE_FINANCIAL_ACTION',
      requestedBy: req.user!.id,
      amountMicros: req.body.amountMicros,
      payload: req.body.payload,
    });
    res.json({ success: true, request });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create dual approval request.' });
  }
});

router.post('/admin/dual-approvals/:id/approve', requireAuth, requireRole('superadmin'), adminRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await approveDualApprovalRequest(id, req.user!.id, req.body.note);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Dual approval failed.' });
  }
});

router.post('/admin/dual-approvals/:id/reject', requireAuth, requireRole('superadmin'), adminRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request = await rejectDualApprovalRequest(id, req.user!.id, req.body.note || 'Rejected by superadmin');
    res.json({ success: true, request });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to reject dual approval request.' });
  }
});

// 9. Phase 4: Model Pricing Metadata Endpoints
router.get('/admin/model-pricing', requireAuth, adminRateLimiter, async (req: AuthRequest, res: Response) => {
  const metadata = await getAllModelPricingMetadata();
  res.json({ metadata });
});

router.post('/admin/model-pricing/:modelId', requireAuth, requireRole('superadmin'), adminRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { modelId } = req.params;
    const updated = await updateModelPricingMetadata(modelId, req.body);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'UPDATE_MODEL_PRICING', modelId });
    res.json({ success: true, metadata: updated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update model pricing metadata.' });
  }
});

export default router;
