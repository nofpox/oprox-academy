import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logSecurityAudit } from './audit';

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

const JWT_SECRET = process.env.JWT_SECRET || 'oprox-os-phase1-secure-jwt-key-2026';

// Blacklist store for invalidated tokens (logout)
const tokenBlacklist = new Set<string>();

export function generateToken(user: AuthenticatedUser, expiresIn: string = '8h'): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, orgId: user.orgId }, JWT_SECRET, {
    expiresIn: expiresIn as any,
  });
}

export function invalidateToken(token: string): void {
  tokenBlacklist.add(token);
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
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Missing authentication token' });
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  if (tokenBlacklist.has(token)) {
    logSecurityAudit('AUTH_FAILURE', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Token has been invalidated/logged out' });
    return res.status(401).json({ error: 'Session invalidated. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
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
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token && !tokenBlacklist.has(token)) {
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
