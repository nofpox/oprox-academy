/**
 * OPROX Studio Phase 1 — Studio Flow Graph Engine
 * Manages flow graph state, edge validation, cycle detection, and visual flow simulation.
 */

import { StudioFlowGraph, StudioFlowNode, StudioFlowEdge } from './studioIr';

export interface FlowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FlowExecutionStep {
  stepIndex: number;
  nodeId: string;
  kind: string;
  label: string;
  outputState: Record<string, any>;
  timestamp: string;
}

export function validateStudioFlowGraph(graph: StudioFlowGraph): FlowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!graph || typeof graph !== 'object') {
    return { valid: false, errors: ['Flow graph is invalid or empty.'], warnings: [] };
  }

  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const nodeMap = new Map<string, StudioFlowNode>();
  for (const node of nodes) {
    if (nodeMap.has(node.id)) {
      errors.push(`Duplicate flow node ID detected: ${node.id}`);
    } else {
      nodeMap.set(node.id, node);
    }
  }

  // Check triggers
  const triggers = nodes.filter((n) => n.kind === 'TRIGGER');
  if (nodes.length > 0 && triggers.length === 0) {
    warnings.push('Flow graph contains action nodes but no starting TRIGGER node.');
  }

  // Validate edges
  const adjList = new Map<string, string[]>();
  for (const edge of edges) {
    if (!nodeMap.has(edge.sourceId)) {
      errors.push(`Edge [${edge.id}] targets non-existent source node: ${edge.sourceId}`);
    }
    if (!nodeMap.has(edge.targetId)) {
      errors.push(`Edge [${edge.id}] targets non-existent target node: ${edge.targetId}`);
    }

    if (!adjList.has(edge.sourceId)) {
      adjList.set(edge.sourceId, []);
    }
    adjList.get(edge.sourceId)!.push(edge.targetId);
  }

  // Cycle Detection (DFS)
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        errors.push(`Infinite cycle loop detected in flow graph starting near node [${node.id}].`);
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function simulateFlowExecution(
  graph: StudioFlowGraph,
  initialInput?: Record<string, any>
): { steps: FlowExecutionStep[]; finalState: Record<string, any> } {
  const steps: FlowExecutionStep[] = [];
  let currentState: Record<string, any> = { ...initialInput, timestamp: new Date().toISOString() };

  const triggers = (graph.nodes || []).filter((n) => n.kind === 'TRIGGER');
  if (triggers.length === 0) {
    return { steps, finalState: currentState };
  }

  const edgeMap = new Map<string, string[]>();
  for (const edge of graph.edges || []) {
    if (!edgeMap.has(edge.sourceId)) edgeMap.set(edge.sourceId, []);
    edgeMap.get(edge.sourceId)!.push(edge.targetId);
  }

  const nodeMap = new Map<string, StudioFlowNode>();
  for (const node of graph.nodes || []) {
    nodeMap.set(node.id, node);
  }

  const queue: string[] = triggers.map((t) => t.id);
  const executedNodes = new Set<string>();
  let stepCounter = 1;

  while (queue.length > 0 && stepCounter <= 50) {
    const currentId = queue.shift()!;
    if (executedNodes.has(currentId)) continue;
    executedNodes.add(currentId);

    const node = nodeMap.get(currentId);
    if (!node) continue;

    // Simulate step execution based on kind
    switch (node.kind) {
      case 'TRIGGER':
        currentState = { ...currentState, lastEvent: 'TRIGGER_FIRED', triggerConfig: node.config };
        break;
      case 'ACTION':
        currentState = { ...currentState, lastAction: node.label, actionConfig: node.config };
        break;
      case 'STATE_UPDATE':
        if (node.config?.key) {
          currentState[node.config.key] = node.config.value;
        }
        break;
      case 'API_REQUEST':
        currentState = { ...currentState, apiResponse: { status: 200, data: { success: true } } };
        break;
      case 'AI_AGENT':
        currentState = { ...currentState, aiResponse: 'Simulated Studio AI Agent output' };
        break;
      default:
        break;
    }

    steps.push({
      stepIndex: stepCounter++,
      nodeId: node.id,
      kind: node.kind,
      label: node.label,
      outputState: { ...currentState },
      timestamp: new Date().toISOString(),
    });

    const nextNodes = edgeMap.get(currentId) || [];
    for (const nextId of nextNodes) {
      if (!executedNodes.has(nextId)) {
        queue.push(nextId);
      }
    }
  }

  return { steps, finalState: currentState };
}
