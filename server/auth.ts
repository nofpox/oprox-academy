import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logSecurityAudit } from './audit';
import { getRedisClient, isRedisConnected } from '../src/lib/redis';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  orgId: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is required but not set. ' +
    'Server cannot start without a secure signing secret. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}
const JWT_SECRET = process.env.JWT_SECRET;

// Blacklist store for invalidated tokens (logout) — in-memory fallback
const tokenBlacklist = new Set<string>();

export function generateToken(user: AuthenticatedUser, expiresIn: string = '8h'): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, orgId: user.orgId }, JWT_SECRET, {
    expiresIn: expiresIn as any,
  });
}

export async function invalidateToken(token: string): Promise<void> {
  // Always add to in-memory set as synchronous fallback
  tokenBlacklist.add(token);

  // Also write to Redis if available, with TTL derived from token expiry
  if (isRedisConnected()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const decoded = jwt.decode(token) as { exp?: number } | null;
        const ttl = decoded?.exp ? Math.max(1, decoded.exp - Math.floor(Date.now() / 1000)) : 28800;
        await redis.setex('token_blacklist:' + token, ttl, '1');
      } catch {
        // Redis write failure is non-fatal; in-memory set already updated
      }
    }
  }
}

// Helper to extract bearer token or cookie
export function extractToken(req: Request): string | null {
  if (!req || !req.headers) return null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const tokenHeader = req.headers['x-access-token'];
  if (typeof tokenHeader === 'string') {
    return tokenHeader;
  }
  return null;
}

// 1. Authentication Middleware (Requires valid logged-in user)
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Missing authentication token' });
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  // Check Redis first (cross-instance invalidation), fall through to in-memory on failure
  if (isRedisConnected()) {
    const redis = getRedisClient();
    if (redis) {
      try {
        const blacklisted = await redis.exists('token_blacklist:' + token);
        if (blacklisted) {
          logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Token has been invalidated/logged out' });
          return res.status(401).json({ error: 'Session invalidated. Please log in again.' });
        }
      } catch {
        // Redis check failure falls through to in-memory check below
      }
    }
  }

  if (tokenBlacklist.has(token)) {
    logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Token has been invalidated/logged out' });
    return res.status(401).json({ error: 'Session invalidated. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser & { iat?: number };
    // Task #5: reject tokens issued before the secret rotation cutoff.
    // Operators set JWT_ISSUED_AFTER (Unix seconds) after rotating JWT_SECRET.
    const issuedAfterTs = process.env.JWT_ISSUED_AFTER ? parseInt(process.env.JWT_ISSUED_AFTER, 10) : 0;
    if (issuedAfterTs > 0 && typeof decoded.iat === 'number' && decoded.iat < issuedAfterTs) {
      logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Token predates JWT secret rotation cutoff' });
      return res.status(401).json({ error: 'Session invalidated due to a security rotation. Please log in again.' });
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      orgId: decoded.orgId,
    };
    next();
  } catch (err: any) {
    logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Invalid or expired token', error: err.message });
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

// Optional Auth (populates req.user if token present, but proceeds anyway)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    let isBlacklisted = false;

    // Check Redis first, fall through to in-memory on failure
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const blacklisted = await redis.exists('token_blacklist:' + token);
          if (blacklisted) isBlacklisted = true;
        } catch {
          // Redis check failure falls through to in-memory check
        }
      }
    }

    if (!isBlacklisted && tokenBlacklist.has(token)) {
      isBlacklisted = true;
    }

    if (!isBlacklisted) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          orgId: decoded.orgId,
        };
      } catch {
        // Ignore invalid token in optional auth
      }
    }
  }
  next();
}

// 2. Authorization / RBAC Middleware
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logSecurityAudit('AUTHORIZATION_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Unauthenticated user attempting role access' });
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = req.user.role;
    // Hierarchy check or explicit allowed roles check
    const isAllowed = allowedRoles.includes(userRole) || (allowedRoles.includes('admin') && userRole === 'superadmin');

    if (!isAllowed) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, {
        reason: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        actualRole: userRole,
      });
      return res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] privileges.` });
    }

    next();
  };
}

// 3. Organization / Tenant Access Gate Middleware (Phase 1)
export function requireOrgAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    logSecurityAudit('AUTHORIZATION_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Unauthenticated user attempting org access' });
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Superadmins can access any org
  if (req.user.role === 'superadmin') {
    return next();
  }

  const requestedOrgId = req.params.orgId || req.body?.orgId || req.query?.orgId;

  if (requestedOrgId && requestedOrgId !== req.user.orgId) {
    logSecurityAudit('AUTHORIZATION_FAILURE', req, {
      reason: 'Cross-tenant organization access attempt blocked',
      requestedOrgId,
      userOrgId: req.user.orgId,
    });
    return res.status(403).json({ error: 'Forbidden: Cannot access resources outside your organization.' });
  }

  next();
}
