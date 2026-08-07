import { logStructured } from './logger';
import {
  createDevEnvironmentInStore,
  getDevEnvironmentsFromStore,
  updateDevEnvironmentStatusInStore,
  createPreviewEnvironmentInStore,
  getPreviewEnvironmentsFromStore,
} from './phase6Store';

export type EnvironmentLifecycleStatus =
  | 'REQUESTED'
  | 'PROVISIONING'
  | 'READY'
  | 'BUSY'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'EXPIRED';

export function checkCloudDevEnvironmentProvider(): {
  isConfigured: boolean;
  providerName: string;
  reason?: string;
} {
  const provider = process.env.CDE_PROVIDER || process.env.CLOUD_RUN_DEV_PROVIDER;
  if (!provider) {
    return {
      isConfigured: false,
      providerName: 'NONE',
      reason: 'No Cloud Development Environment provider (CDE_PROVIDER / CLOUD_RUN_DEV_PROVIDER) configured',
    };
  }
  return {
    isConfigured: true,
    providerName: provider,
  };
}

export async function provisionDevEnvironment(options: {
  tenantId: string;
  projectId?: string;
  name: string;
  branchName: string;
  commitSha: string;
  createdBy: string;
}): Promise<{
  status: 'READY' | 'NOT_CONFIGURED' | 'FAILED';
  envId?: string;
  reason?: string;
}> {
  const providerCheck = checkCloudDevEnvironmentProvider();
  if (!providerCheck.isConfigured) {
    return {
      status: 'NOT_CONFIGURED',
      reason: providerCheck.reason,
    };
  }

  const envId = `devenv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await createDevEnvironmentInStore({
    id: envId,
    tenantId: options.tenantId,
    projectId: options.projectId,
    name: options.name,
    branchName: options.branchName,
    commitSha: options.commitSha,
    provider: providerCheck.providerName,
    status: 'READY',
    createdBy: options.createdBy,
  });

  return {
    status: 'READY',
    envId,
  };
}

export async function provisionPreviewEnvironment(options: {
  tenantId: string;
  projectId?: string;
  changeRequestId: string;
  commitSha: string;
  createdBy: string;
}): Promise<{
  status: 'READY' | 'NOT_CONFIGURED' | 'FAILED';
  previewId?: string;
  previewUrl?: string;
  reason?: string;
}> {
  const providerCheck = checkCloudDevEnvironmentProvider();
  if (!providerCheck.isConfigured) {
    return {
      status: 'NOT_CONFIGURED',
      reason: providerCheck.reason,
    };
  }

  const previewId = `prev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const previewUrl = `https://preview-${options.changeRequestId.substring(0, 8)}.oprox.internal`;

  await createPreviewEnvironmentInStore({
    id: previewId,
    tenantId: options.tenantId,
    projectId: options.projectId,
    changeRequestId: options.changeRequestId,
    commitSha: options.commitSha,
    previewUrl,
    status: 'READY',
    healthStatus: 'HEALTHY',
    createdBy: options.createdBy,
  });

  return {
    status: 'READY',
    previewId,
    previewUrl,
  };
}
