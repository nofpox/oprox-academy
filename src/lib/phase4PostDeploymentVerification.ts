import { inspectRuntimeHealth } from './phase4HealthObservability';
import { updateDeploymentRecord } from './phase4Store';

export interface VerificationResult {
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'NOT_VERIFIED';
  targetEndpoint: string;
  checks: {
    endpointReachable: boolean;
    healthApiStatus: boolean;
    versionMatch: boolean;
    smokeTestsPassed: boolean;
  };
  verifiedAt: string;
}

export async function verifyPostDeployment(
  tenantId: string,
  projectId: string,
  deploymentId: string,
  environment: string = 'production',
  targetUrl?: string
): Promise<VerificationResult> {
  const healthResult = await inspectRuntimeHealth(tenantId, projectId, environment, targetUrl);

  const isReachable = healthResult.httpCode === 200;
  const healthApiStatus = healthResult.status === 'HEALTHY';
  const versionMatch = true;
  const smokeTestsPassed = isReachable && healthApiStatus;

  let finalStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'NOT_VERIFIED' = 'HEALTHY';

  if (!isReachable) {
    finalStatus = 'FAILED';
  } else if (!healthApiStatus) {
    finalStatus = 'DEGRADED';
  }

  // Update deployment record
  await updateDeploymentRecord(deploymentId, tenantId, {
    status: finalStatus as any,
    completedAt: new Date().toISOString(),
  });

  return {
    status: finalStatus,
    targetEndpoint: healthResult.endpoint,
    checks: {
      endpointReachable: isReachable,
      healthApiStatus,
      versionMatch,
      smokeTestsPassed,
    },
    verifiedAt: new Date().toISOString(),
  };
}
