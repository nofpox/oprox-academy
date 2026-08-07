import { db, memoryDb } from "../db";
import { platformHealthSnapshotsTable } from "../db/schema";
import { getRedisStatus } from "./redis";

export interface HealthCheckResult {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  details?: string;
}

export interface HealthSnapshot {
  id?: string;
  overallStatus: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  checks: HealthCheckResult[];
  createdAt: string;
}

export async function collectHealthSnapshot(): Promise<HealthSnapshot> {
  const startTime = Date.now();
  const checks: HealthCheckResult[] = [];

  // 1. Database Check
  const dbStart = Date.now();
  if (db) {
    try {
      await db.execute(db.raw ? db.raw`SELECT 1` : 'SELECT 1' as any);
      checks.push({
        service: "PostgreSQL Database Engine",
        status: "healthy",
        latencyMs: Date.now() - dbStart,
        details: "PostgreSQL connected and responsive",
      });
    } catch (err: any) {
      checks.push({
        service: "PostgreSQL Database Engine",
        status: "unhealthy",
        latencyMs: Date.now() - dbStart,
        details: `PostgreSQL connection error: ${err?.message || 'Query failed'}`,
      });
    }
  } else {
    checks.push({
      service: "PostgreSQL Database Engine",
      status: process.env.NODE_ENV === "production" ? "unhealthy" : "degraded",
      latencyMs: 0,
      details: process.env.NODE_ENV === "production" 
        ? "PostgreSQL NOT CONFIGURED (DATABASE_URL missing in production)" 
        : "In-Memory Fallback Store (Development Mode)",
    });
  }

  // 2. Redis Check
  const redisInfo = getRedisStatus();
  checks.push({
    service: "Redis Distributed Cache & Rate Limiter",
    status: redisInfo.status === "connected" ? "healthy" : redisInfo.status === "not_configured" ? "degraded" : "unhealthy",
    latencyMs: 0,
    details: redisInfo.details,
  });

  // 3. AI Provider Credentials Check
  const geminiConfigured = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  checks.push({
    service: "AI Provider API Pipeline",
    status: geminiConfigured ? "healthy" : "degraded",
    latencyMs: 0,
    details: geminiConfigured ? "Gemini API key configured" : "Gemini API key not set (Local fallback active)",
  });

  // 4. Runtime Process Memory
  const memMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  checks.push({
    service: "Node.js Process Runtime",
    status: "healthy",
    latencyMs: 1,
    details: `Memory: ${memMb}MB heap used, Uptime: ${Math.round(process.uptime())}s`,
  });

  const overallStatus = checks.some((c) => c.status === "unhealthy")
    ? "unhealthy"
    : checks.some((c) => c.status === "degraded")
    ? "degraded"
    : "healthy";

  const totalLatency = Date.now() - startTime;
  const snapshot: HealthSnapshot = {
    id: `snap_${Date.now()}`,
    overallStatus,
    latencyMs: totalLatency,
    checks,
    createdAt: new Date().toISOString(),
  };

  if (db) {
    try {
      await db.insert(platformHealthSnapshotsTable).values({
        overallStatus,
        latencyMs: totalLatency,
        checks,
        createdAt: new Date(),
      });
    } catch {
      memoryDb.healthSnapshots.unshift({
        id: snapshot.id,
        overallStatus,
        latencyMs: totalLatency,
        checks,
        createdAt: new Date(),
      });
    }
  } else {
    memoryDb.healthSnapshots.unshift({
      id: snapshot.id,
      overallStatus,
      latencyMs: totalLatency,
      checks,
      createdAt: new Date(),
    });
  }

  return snapshot;
}

export async function getHealthSnapshotHistory() {
  if (db) {
    try {
      const rows = await db.select().from(platformHealthSnapshotsTable);
      return rows;
    } catch {
      return memoryDb.healthSnapshots;
    }
  }
  return memoryDb.healthSnapshots;
}
