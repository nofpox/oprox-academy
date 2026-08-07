import { getEnvConfigsByTenant, upsertEnvConfigRecord, EnvConfigRecord } from './phase4Store';

export interface EnvValidationResult {
  environment: string;
  isReady: boolean;
  variables: {
    key: string;
    status: 'CONFIGURED' | 'MISSING' | 'INVALID_REFERENCE';
    isRequired: boolean;
  }[];
  missingRequiredCount: number;
}

const REQUIRED_ENV_KEYS: Record<string, string[]> = {
  development: ['PORT'],
  preview: ['PORT'],
  staging: ['PORT', 'JWT_SECRET'],
  production: ['PORT', 'DATABASE_URL', 'JWT_SECRET', 'MASTER_ENCRYPTION_KEY'],
};

/**
 * Validates environment configuration without exposing secret values or credentials.
 * Status values exposed: CONFIGURED | MISSING | INVALID_REFERENCE
 */
export async function validateEnvironmentConfig(
  tenantId: string,
  environment: string = 'production'
): Promise<EnvValidationResult> {
  const envKeys = REQUIRED_ENV_KEYS[environment] || REQUIRED_ENV_KEYS['production'];
  const results: { key: string; status: 'CONFIGURED' | 'MISSING' | 'INVALID_REFERENCE'; isRequired: boolean }[] = [];

  let missingCount = 0;

  for (const key of envKeys) {
    const val = process.env[key];
    let status: 'CONFIGURED' | 'MISSING' | 'INVALID_REFERENCE' = 'CONFIGURED';

    if (!val || val.trim() === '') {
      status = 'MISSING';
      missingCount++;
    } else if (val.startsWith('secret://invalid') || val.includes('EXAMPLE_PLACEHOLDER')) {
      status = 'INVALID_REFERENCE';
      missingCount++;
    }

    results.push({
      key,
      status,
      isRequired: true,
    });

    // Record in DB store
    const recId = `env_${tenantId}_${environment}_${key}`;
    await upsertEnvConfigRecord({
      id: recId,
      tenantId,
      environment,
      varKey: key,
      status,
      isRequired: true,
      updatedAt: new Date().toISOString(),
    });
  }

  // Also query any stored custom env configurations
  const stored = await getEnvConfigsByTenant(tenantId, environment);
  for (const item of stored) {
    if (!results.find((r) => r.key === item.varKey)) {
      results.push({
        key: item.varKey,
        status: item.status,
        isRequired: item.isRequired,
      });
      if (item.isRequired && item.status !== 'CONFIGURED') {
        missingCount++;
      }
    }
  }

  return {
    environment,
    isReady: missingCount === 0,
    variables: results,
    missingRequiredCount: missingCount,
  };
}
