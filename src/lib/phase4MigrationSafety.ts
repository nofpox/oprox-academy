import fs from 'fs';
import path from 'path';
import { recordMigrationExecution, getMigrationHistory, MigrationHistoryRecord } from './phase4Store';

export interface PendingMigration {
  migrationName: string;
  isDestructive: boolean;
  destructiveOperations: string[];
  sqlContent: string;
}

export interface MigrationSafetyReport {
  hasPendingMigrations: boolean;
  pendingMigrations: PendingMigration[];
  hasDestructiveOperations: boolean;
  requiresElevatedConfirmation: boolean;
}

const DESTRUCTIVE_KEYWORDS = [
  'DROP TABLE',
  'DROP COLUMN',
  'TRUNCATE',
  'DROP DATABASE',
  'DROP SCHEMA',
];

/**
 * Inspects SQL migration files in drizzle/ directory for destructive operations.
 */
export function analyzeMigrationSql(sqlContent: string): { isDestructive: boolean; operations: string[] } {
  const upper = sqlContent.toUpperCase();
  const operations: string[] = [];

  if (upper.includes('DROP TABLE')) operations.push('DROP TABLE');
  if (upper.includes('DROP COLUMN')) operations.push('DROP COLUMN');
  if (upper.includes('TRUNCATE')) operations.push('TRUNCATE');
  if (upper.includes('DROP DATABASE')) operations.push('DROP DATABASE');
  if (upper.includes('DROP SCHEMA')) operations.push('DROP SCHEMA');

  return {
    isDestructive: operations.length > 0,
    operations,
  };
}

/**
 * Checks pending migrations and analyzes safety.
 */
export async function getPendingMigrationsSafety(
  tenantId: string,
  environment: string = 'production'
): Promise<MigrationSafetyReport> {
  const drizzleDir = path.resolve(process.cwd(), 'drizzle');
  const history = await getMigrationHistory(tenantId);
  const appliedNames = new Set(history.map((h) => h.migrationName));

  const pendingMigrations: PendingMigration[] = [];
  let hasDestructive = false;

  if (fs.existsSync(drizzleDir)) {
    const files = fs.readdirSync(drizzleDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (!appliedNames.has(file)) {
        const sql = fs.readFileSync(path.join(drizzleDir, file), 'utf-8');
        const analysis = analyzeMigrationSql(sql);

        if (analysis.isDestructive) {
          hasDestructive = true;
        }

        pendingMigrations.push({
          migrationName: file,
          isDestructive: analysis.isDestructive,
          destructiveOperations: analysis.operations,
          sqlContent: sql,
        });
      }
    }
  }

  return {
    hasPendingMigrations: pendingMigrations.length > 0,
    pendingMigrations,
    hasDestructiveOperations: hasDestructive,
    requiresElevatedConfirmation: hasDestructive && environment === 'production',
  };
}

/**
 * Executes or records migration execution with explicit elevated confirmation check for destructive operations.
 */
export async function executeControlledMigration(params: {
  tenantId: string;
  environment?: string;
  migrationName: string;
  actorId: string;
  confirmedBy?: string;
  actorRole?: string;
}): Promise<MigrationHistoryRecord> {
  const environment = params.environment || 'production';
  const drizzleDir = path.resolve(process.cwd(), 'drizzle');
  const filePath = path.join(drizzleDir, params.migrationName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file ${params.migrationName} not found.`);
  }

  const sqlContent = fs.readFileSync(filePath, 'utf-8');
  const analysis = analyzeMigrationSql(sqlContent);

  if (analysis.isDestructive && environment === 'production') {
    // Must be confirmed by superadmin or explicit dual approval confirmation
    const isSuperAdmin = params.actorRole === 'superadmin';
    const isConfirmedBySuper = !!params.confirmedBy;

    if (!isSuperAdmin && !isConfirmedBySuper) {
      const blockedRecord: MigrationHistoryRecord = {
        id: `mig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId: params.tenantId,
        environment,
        migrationName: params.migrationName,
        isDestructive: true,
        actorId: params.actorId,
        status: 'BLOCKED',
        executedAt: new Date().toISOString(),
      };
      await recordMigrationExecution(blockedRecord);
      throw new Error(
        `DESTRUCTIVE_MIGRATION_BLOCKED: Migration ${params.migrationName} contains destructive operations [${analysis.operations.join(
          ', '
        )}] and requires explicit elevated confirmation by a superadmin.`
      );
    }
  }

  // Record successful migration execution
  const record: MigrationHistoryRecord = {
    id: `mig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: params.tenantId,
    environment,
    migrationName: params.migrationName,
    isDestructive: analysis.isDestructive,
    actorId: params.actorId,
    confirmedBy: params.confirmedBy,
    status: 'APPLIED',
    executedAt: new Date().toISOString(),
  };

  return await recordMigrationExecution(record);
}
