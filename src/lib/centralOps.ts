import { memoryDb, db } from '../db';
import { jobQueueAuditTable } from '../db/schema';
import { getRedisStatus } from './redis';

export async function getQueueMetrics() {
  if (db) {
    try {
      const rows = await db.select().from(jobQueueAuditTable);
      return {
        activeJobs: rows.filter((r) => r.status === 'active').length,
        waitingJobs: rows.filter((r) => r.status === 'waiting').length,
        completedJobs: rows.filter((r) => r.status === 'completed').length,
        failedJobs: rows.filter((r) => r.status === 'failed' || r.status === 'dlq').length,
        recentJobs: rows.slice(-15).reverse(),
      };
    } catch {
      // Fallback
    }
  }

  const jobs = memoryDb.jobQueueAudit;
  return {
    activeJobs: jobs.filter((j) => j.status === 'active').length,
    waitingJobs: jobs.filter((j) => j.status === 'waiting').length,
    completedJobs: jobs.filter((j) => j.status === 'completed').length,
    failedJobs: jobs.filter((j) => j.status === 'failed' || j.status === 'dlq').length,
    recentJobs: jobs.slice(-15).reverse(),
  };
}

export async function getWorkerStatus() {
  const mem = process.memoryUsage();
  return [
    {
      workerId: `proc_${process.pid}`,
      type: 'express_http_worker',
      status: 'online',
      memoryMb: Math.round(mem.heapUsed / 1024 / 1024),
      uptimeSec: Math.round(process.uptime()),
    },
  ];
}

export async function getInfrastructureStatus() {
  const redisInfo = getRedisStatus();
  return {
    environment: process.env.NODE_ENV || 'development',
    serverProcess: {
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMb: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    },
    database: {
      status: db ? 'connected' : 'not_configured',
      engine: db ? 'PostgreSQL' : 'In-Memory Fallback',
      configured: !!process.env.DATABASE_URL,
    },
    redisCache: redisInfo,
    backups: {
      status: process.env.DATABASE_URL ? 'managed_by_postgresql_host' : 'not_applicable',
    },
  };
}
