// Security Audit Logger for OPROX OS
export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType: 
    | 'AUTH_SUCCESS'
    | 'AUTH_FAILURE'
    | 'AUTHORIZATION_FAILURE'
    | 'KILLSWITCH_DENIAL'
    | 'COSTGUARD_DENIAL'
    | 'AI_WALLET_DENIAL'
    | 'RATE_LIMIT_DENIAL'
    | 'INVALID_STRIPE_WEBHOOK'
    | 'PRIVILEGED_ADMIN_ACTION'
    | 'SOURCE_DOWNLOAD_ATTEMPT'
    | 'WALLET_RESERVATION_FAILED'
    | 'RESERVATION_ROLLED_BACK'
    | 'COSTGUARD_AUTO_KILLSWITCH'
    | 'ENCRYPTION_FAILED'
    | 'DECRYPTION_FAILED'
    | 'ACADEMY_ASSESSMENT_CREATED'
    | 'ACADEMY_ATTEMPT_STARTED'
    | 'ACADEMY_ATTEMPT_SUBMITTED'
    | 'ACADEMY_ASSIGNMENT_SUBMITTED'
    | 'ACADEMY_ASSIGNMENT_GRADED'
    | 'ACADEMY_CERTIFICATE_ISSUED'
    | 'ACADEMY_COURSE_CREATED'
    | 'ACADEMY_COURSE_UPDATED'
    | 'ACADEMY_COURSE_PUBLISHED'
    | 'ACADEMY_COURSE_UNPUBLISHED'
    | 'ACADEMY_ORG_PROGRAM_CREATED'
    | 'ACADEMY_ORG_ASSIGNMENT_CREATED'
    | 'ACADEMY_ADMIN_ACTION'
    | 'ACADEMY_TUTOR_SESSION_CREATED'
    | 'ACADEMY_TUTOR_INTERACTION'
    | 'ACADEMY_MASTERY_UPDATED'
    | 'ACADEMY_LAB_SESSION_STARTED'
    | 'ACADEMY_LAB_SUBMITTED';
  userId?: string;
  userRole?: string;
  orgId?: string;
  ip: string;
  path: string;
  method: string;
  details: Record<string, any>;
}

const auditLogStore: SecurityAuditEvent[] = [];

// Helper to sanitize sensitive keys from details
function sanitizeDetails(details: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'secretKey', 'webhookSecret'];

  for (const [key, value] of Object.entries(details)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeDetails(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function logSecurityAudit(
  eventType: SecurityAuditEvent['eventType'],
  req: { ip?: string; path?: string; method?: string; user?: { id?: string; role?: string; orgId?: string } },
  details: Record<string, any> = {}
): SecurityAuditEvent {
  const event: SecurityAuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    eventType,
    userId: req.user?.id || 'anonymous',
    userRole: req.user?.role || 'none',
    orgId: req.user?.orgId || 'none',
    ip: req.ip || '0.0.0.0',
    path: req.path || 'unknown',
    method: req.method || 'UNKNOWN',
    details: sanitizeDetails(details),
  };

  auditLogStore.unshift(event);
  if (auditLogStore.length > 1000) {
    auditLogStore.pop();
  }

  console.log(`[SECURITY AUDIT] [${event.eventType}] [${event.ip}] Path: ${event.path} | User: ${event.userId} (${event.userRole})`);

  return event;
}

export function getAuditLogs(): SecurityAuditEvent[] {
  return [...auditLogStore];
}
