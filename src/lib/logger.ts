export type LogLevel = 'info' | 'warn' | 'error' | 'audit';

export interface StructuredLogEvent {
  timestamp: string;
  level: LogLevel;
  event: string;
  correlationId?: string;
  context?: Record<string, any>;
  data?: Record<string, any>;
}

export function sanitizeLogData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeLogData);

  const sanitized: Record<string, any> = {};
  const sensitiveKeys = [
    'password',
    'token',
    'authorization',
    'secret',
    'key',
    'masterkey',
    'master_encryption_key',
    'stripe_secret_key',
    'jwt_secret',
    'apikey',
    'webhooksecret',
  ];

  for (const [k, v] of Object.entries(obj)) {
    const lowerKey = k.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      sanitized[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      sanitized[k] = sanitizeLogData(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

export function logStructured(level: LogLevel, event: string, data?: Record<string, any>, context?: Record<string, any>) {
  const logObj: StructuredLogEvent = {
    timestamp: new Date().toISOString(),
    level,
    event,
    context: sanitizeLogData(context),
    data: sanitizeLogData(data),
  };

  const line = JSON.stringify(logObj);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
