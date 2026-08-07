import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index';
import path from 'path';
import { logStructured } from '../lib/logger';

export async function runMigrations(): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    logStructured('info', 'MIGRATION_SKIPPED', { reason: 'No PostgreSQL database instance configured (memory mode).' });
    return { success: true };
  }

  try {
    const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
    logStructured('info', 'MIGRATION_STARTING', { folder: migrationsFolder });
    await migrate(db, { migrationsFolder });
    logStructured('info', 'MIGRATION_SUCCESSFUL', {});
    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    logStructured('error', 'MIGRATION_FAILED', { error: errorMsg });
    return { success: false, error: errorMsg };
  }
}

if (require.main === module) {
  runMigrations().then((res) => {
    if (!res.success) {
      process.exit(1);
    }
    process.exit(0);
  });
}
