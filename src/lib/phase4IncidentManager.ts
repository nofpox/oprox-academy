import { createIncidentRecord, getIncidentsByTenant, IncidentRecord } from './phase4Store';

export type IncidentCategory =
  | 'BUILD_FAILURE'
  | 'TEST_FAILURE'
  | 'SECURITY_GATE_FAILURE'
  | 'MIGRATION_FAILURE'
  | 'DEPLOYMENT_FAILURE'
  | 'HEALTH_CHECK_FAILURE'
  | 'SMOKE_TEST_FAILURE'
  | 'PROVIDER_FAILURE'
  | 'CONFIGURATION_FAILURE';

export async function createOperationalIncident(params: {
  tenantId: string;
  projectId: string;
  environment?: string;
  failureCategory: IncidentCategory;
  summary: string;
  evidence?: Record<string, any>;
  remediation?: string;
}): Promise<IncidentRecord> {
  const record: IncidentRecord = {
    id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: params.tenantId,
    projectId: params.projectId,
    environment: params.environment || 'production',
    failureCategory: params.failureCategory,
    summary: params.summary,
    evidence: params.evidence || {},
    status: 'OPEN',
    remediation: params.remediation,
    createdAt: new Date().toISOString(),
  };

  return await createIncidentRecord(record);
}

export async function getTenantIncidents(
  tenantId: string,
  environment?: string
): Promise<IncidentRecord[]> {
  return await getIncidentsByTenant(tenantId, environment);
}
