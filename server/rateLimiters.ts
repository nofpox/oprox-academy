import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logSecurityAudit } from './audit';

// 1. Auth Rate Limiter (5 attempts per 15 minutes)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSecurityAudit('RATE_LIMIT_DENIAL', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Auth rate limit exceeded' });
    res.status(429).json({ error: 'Too many login attempts. Please try again in 15 minutes.' });
  },
});

// 2. Sensitive Admin Operations Limiter (30 attempts per minute)
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSecurityAudit('RATE_LIMIT_DENIAL', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Admin operations rate limit exceeded' });
    res.status(429).json({ error: 'Too many administrative requests. Rate limit exceeded.' });
  },
});

// 3. Webhook Rate Limiter (60 attempts per minute)
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSecurityAudit('RATE_LIMIT_DENIAL', { ip: req.ip, path: req.path, method: req.method }, { reason: 'Webhook rate limit exceeded' });
    res.status(429).json({ error: 'Webhook rate limit exceeded.' });
  },
});
