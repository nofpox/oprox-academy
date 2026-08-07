// Central AI Governance State & Gate Module (Phase 3 Distributed Engine)
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, extractToken, AuthenticatedUser } from './auth';
import { logSecurityAudit } from './audit';
import { setKillSwitch as setKillSwitchLib, isKillSwitchActive } from '../src/lib/killSwitch';
import { getCostGuardSettings, getCostGuardDailyUsage, recordCostGuardUsage } from '../src/lib/costGuard';
import { getWalletBalance as getWalletBalanceLib, adjustWalletBalance } from '../src/lib/aiWallet';
import { checkDistributedRateLimit, clearMemoryRateStore } from '../src/lib/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'oprox-os-phase1-secure-jwt-key-2026';

// Shared State for Governance Overrides (Kept for backwards compatibility and test overrides)
export interface GovernanceState {
  killSwitchActive: boolean;
  costGuardActive: boolean;
  costGuardDailyLimitUsd: number;
  costGuardCurrentDailyUsd: number;
}

const state: GovernanceState = {
  killSwitchActive: false,
  costGuardActive: true,
  costGuardDailyLimitUsd: 100.0,
  costGuardCurrentDailyUsd: 0.0,
};

export function resetGovernanceState(): void {
  state.killSwitchActive = false;
  state.costGuardActive = true;
  state.costGuardDailyLimitUsd = 100.0;
  state.costGuardCurrentDailyUsd = 0.0;
  clearMemoryRateStore();
}

export function setKillSwitch(active: boolean) {
  state.killSwitchActive = active;
  setKillSwitchLib('all_ai', active).catch(() => {});
}

export function getKillSwitch(): boolean {
  return state.killSwitchActive;
}

export function setCostGuard(active: boolean, dailyLimitUsd: number) {
  state.costGuardActive = active;
  state.costGuardDailyLimitUsd = dailyLimitUsd;
}

export function setCostGuardCurrentDaily(currentUsd: number) {
  state.costGuardCurrentDailyUsd = currentUsd;
}

export function getCostGuard() {
  return {
    active: state.costGuardActive,
    dailyLimitUsd: state.costGuardDailyLimitUsd,
    currentDailyUsd: state.costGuardCurrentDailyUsd,
  };
}

export async function getWalletBalance(id: string): Promise<number> {
  const dbBalanceObj = await getWalletBalanceLib(id);
  return dbBalanceObj.walletMicros;
}

export async function adjustWallet(id: string, deltaMicros: number): Promise<number> {
  const res = await adjustWalletBalance(id, deltaMicros, 'adjustment', 'Governance adjustment');
  return res.balance.walletMicros;
}

// 1. AI Governance Hard Gate Middleware (Fail Closed)
export async function aiGovernanceGate(req: AuthRequest, res: Response, next: NextFunction) {
  const ip = req.ip || '0.0.0.0';

  // 1. Extract & Verify Auth Token if not already set on req.user
  if (!req.user) {
    const token = extractToken(req);
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          orgId: decoded.orgId,
        };
      } catch {
        logSecurityAudit('AUTH_FAILURE', { ip, path: req.path, method: req.method }, { reason: 'Invalid or expired JWT token on AI endpoint' });
        return res.status(401).json({ error: 'Invalid or expired session token.' });
      }
    }
  }

  const user = req.user;

  if (!user) {
    logSecurityAudit('AUTH_FAILURE', { ip, path: req.path, method: req.method }, { reason: 'AI endpoint called without authentication' });
    return res.status(401).json({ error: 'Authentication required to access AI services.' });
  }

  // 2. KillSwitch Check (State variable or persistent DB state)
  const killSwitchFromDb = await isKillSwitchActive('all_ai');
  if (state.killSwitchActive || killSwitchFromDb) {
    logSecurityAudit('KILLSWITCH_DENIAL', req, { reason: 'Global AI KillSwitch is ACTIVE' });
    return res.status(503).json({ error: 'Service Unavailable: AI Execution Engine is currently disabled by global KillSwitch.' });
  }

  // 3. CostGuard Check (Persistent + state)
  const costGuardSettings = await getCostGuardSettings();
  const persistentDailyUsd = await getCostGuardDailyUsage();
  const effectiveDailyUsd = Math.max(state.costGuardCurrentDailyUsd, persistentDailyUsd);
  const effectiveLimitUsd = state.costGuardActive ? state.costGuardDailyLimitUsd : costGuardSettings.maxDailyUsd;

  if (effectiveDailyUsd >= effectiveLimitUsd) {
    logSecurityAudit('COSTGUARD_DENIAL', req, {
      reason: 'CostGuard daily spending budget exhausted',
      limit: effectiveLimitUsd,
      current: effectiveDailyUsd,
    });
    return res.status(429).json({ error: 'Quota Exceeded: CostGuard daily budget limit reached.' });
  }

  // 4. Authoritative AI Wallet Check (DB-backed financial engine, $0.01 = 10,000 micros)
  const walletId = user.orgId || user.id;
  const dbBalanceObj = await getWalletBalanceLib(walletId);
  const userBalanceObj = await getWalletBalanceLib(user.id);
  const balanceMicros = Math.min(dbBalanceObj.walletMicros, userBalanceObj.walletMicros);
  const minRequiredMicros = 10000; // $0.01 minimum

  if (balanceMicros < minRequiredMicros) {
    logSecurityAudit('AI_WALLET_DENIAL', req, {
      reason: 'Insufficient AI Wallet balance',
      userId: user.id,
      orgId: user.orgId,
      balanceMicros,
      minRequiredMicros,
    });
    return res.status(402).json({ error: 'Payment Required: AI Wallet balance is depleted or below execution threshold.' });
  }

  // 5. Multi-Instance Distributed Rate Limiting (15 requests per minute per User/IP)
  const rateKey = `ai_gate:${user.id}_${ip}`;
  const rateLimitRes = await checkDistributedRateLimit(rateKey, 15, 60);

  if (!rateLimitRes.allowed) {
    logSecurityAudit('RATE_LIMIT_DENIAL', req, {
      reason: 'AI endpoint rate limit exceeded',
      count: rateLimitRes.current,
      limit: rateLimitRes.limit,
      redisUsed: rateLimitRes.redisUsed,
    });
    return res.status(429).json({ error: 'Too Many Requests: Rate limit exceeded for AI endpoints.' });
  }

  // Record simulated cost increment for CostGuard tracking ($0.005 per call)
  state.costGuardCurrentDailyUsd += 0.005;
  recordCostGuardUsage(0.005).catch(() => {});

  next();
}

