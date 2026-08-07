export interface AuditExplorerFilter {
  tenantId: string;
  actorId?: string;
  projectId?: string;
  workspaceId?: string;
  action?: string;
  resource?: string;
  risk?: string;
  environment?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface TraceabilityChain {
  requirementId?: string;
  aiTaskId?: string;
  patchId?: string;
  changeRequestId?: string;
  reviewsCount?: number;
  approvalsCount?: number;
  testPassRate?: string;
  releaseGateDecision?: string;
  deploymentId?: string;
  incidentId?: string;
}

export function buildTraceabilitySummary(events: any[]): TraceabilityChain {
  const chain: TraceabilityChain = {};

  for (const event of events || []) {
    const details = event.details || {};
    if (details.requirementId && !chain.requirementId) chain.requirementId = details.requirementId;
    if (details.aiTaskId && !chain.aiTaskId) chain.aiTaskId = details.aiTaskId;
    if (details.patchId && !chain.patchId) chain.patchId = details.patchId;
    if (event.resource === 'CHANGE_REQUEST' && !chain.changeRequestId) chain.changeRequestId = event.resourceId;
    if (event.resource === 'RELEASE_GATE' && !chain.releaseGateDecision) chain.releaseGateDecision = details.decision;
    if (event.resource === 'DEPLOYMENT' && !chain.deploymentId) chain.deploymentId = event.resourceId;
    if (event.resource === 'INCIDENT' && !chain.incidentId) chain.incidentId = event.resourceId;
  }

  return chain;
}
