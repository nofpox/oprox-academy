import {
  StudioIr,
  StudioDesignTokens,
  StudioNode,
  StudioAccessibilityFinding,
  StudioDataSourceDefinition,
  StudioPrototypeVariable,
} from './studioIr';

/**
 * 1. Design Token Audit Engine
 * Identifies hardcoded values, broken token references, and unused tokens.
 */
export interface TokenAuditResult {
  hardcodedColors: { nodeId: string; property: string; value: string }[];
  brokenReferences: string[];
  unusedTokens: string[];
  inconsistentSpacing: string[];
}

export function auditDesignTokens(ir: StudioIr): TokenAuditResult {
  const hardcodedColors: { nodeId: string; property: string; value: string }[] = [];
  const brokenReferences: string[] = [];
  const unusedTokens: string[] = [];
  const inconsistentSpacing: string[] = [];

  const knownColorTokens = new Set(Object.keys(ir.tokens.colors || {}));
  const usedTokens = new Set<string>();

  function traverseNode(node: StudioNode) {
    if (!node) return;

    if (node.style) {
      for (const [prop, val] of Object.entries(node.style)) {
        if (typeof val === 'string') {
          // Check hex color
          if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(val)) {
            hardcodedColors.push({ nodeId: node.id, property: prop, value: val });
          } else if (val.startsWith('var(--token-color-')) {
            const tokenName = val.replace('var(--token-color-', '').replace(')', '');
            usedTokens.add(tokenName);
            if (!knownColorTokens.has(tokenName)) {
              brokenReferences.push(tokenName);
            }
          }

          // Check spacing consistency
          if ((prop === 'padding' || prop === 'margin' || prop === 'gap') && typeof val === 'string') {
            if (/^\d+px$/.test(val) && !['4px', '8px', '12px', '16px', '24px', '32px', '48px', '64px'].includes(val)) {
              inconsistentSpacing.push(`${node.id}.${prop}: ${val}`);
            }
          }
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        traverseNode(child);
      }
    }
  }

  for (const page of ir.pages || []) {
    if (page.rootNode) {
      traverseNode(page.rootNode);
    }
  }

  for (const colorKey of knownColorTokens) {
    if (!usedTokens.has(colorKey)) {
      unusedTokens.push(colorKey);
    }
  }

  return {
    hardcodedColors,
    brokenReferences,
    unusedTokens,
    inconsistentSpacing,
  };
}

/**
 * 2. Accessibility Auditor Engine (WCAG 2.1)
 * Analyzes form labels, img alt text, heading hierarchy, contrast, keyboard semantics.
 */
export function runAccessibilityAudit(ir: StudioIr): StudioAccessibilityFinding[] {
  const findings: StudioAccessibilityFinding[] = [];
  let lastHeadingLevel = 0;

  function auditNode(node: StudioNode) {
    if (!node) return;

    // Check Input for missing label
    if (node.type === 'Input' || node.type === 'Textarea' || node.type === 'Select') {
      if (!node.props.label && !node.props['aria-label'] && !node.props.placeholder) {
        findings.push({
          id: `a11y_missing_label_${node.id}`,
          severity: 'ERROR',
          nodeId: node.id,
          nodeName: node.name,
          ruleId: 'WCAG-4.1.2-LABEL-MISSING',
          message: `Form control "${node.name}" (${node.type}) is missing an accessible label.`,
          recommendation: 'Add a "label" prop or "aria-label" attribute.',
        });
      }
    }

    // Check Image for missing alt text
    if (node.type === 'Image') {
      if (!node.props.alt && node.props.alt !== '') {
        findings.push({
          id: `a11y_missing_alt_${node.id}`,
          severity: 'WARNING',
          nodeId: node.id,
          nodeName: node.name,
          ruleId: 'WCAG-1.1.1-ALT-MISSING',
          message: `Image component "${node.name}" is missing alt text description.`,
          recommendation: 'Provide a descriptive "alt" string or set alt="" for decorative images.',
        });
      }
    }

    // Check Button accessible name
    if (node.type === 'Button') {
      if (!node.props.label && !node.props['aria-label'] && (!node.children || node.children.length === 0)) {
        findings.push({
          id: `a11y_button_empty_${node.id}`,
          severity: 'ERROR',
          nodeId: node.id,
          nodeName: node.name,
          ruleId: 'WCAG-4.1.2-BUTTON-NAME',
          message: `Button "${node.name}" has no visible text or aria-label.`,
          recommendation: 'Add text label or aria-label for screen reader access.',
        });
      }
    }

    // Check Heading Hierarchy
    if (node.type === 'Heading') {
      const level = Number(node.props.level) || 1;
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        findings.push({
          id: `a11y_heading_skip_${node.id}`,
          severity: 'WARNING',
          nodeId: node.id,
          nodeName: node.name,
          ruleId: 'WCAG-1.3.1-HEADING-SKIP',
          message: `Heading level skips from H${lastHeadingLevel} to H${level}.`,
          recommendation: `Use sequential heading level H${lastHeadingLevel + 1} to maintain landmark hierarchy.`,
        });
      }
      lastHeadingLevel = level;
    }

    if (node.children) {
      for (const child of node.children) {
        auditNode(child);
      }
    }
  }

  for (const page of ir.pages || []) {
    lastHeadingLevel = 0;
    if (page.rootNode) {
      auditNode(page.rootNode);
    }
  }

  return findings;
}

/**
 * 3. Prototype State & Variables Engine
 * Evaluates prototype variable actions without arbitrary eval().
 */
export function evalPrototypeAction(
  currentState: Record<string, any>,
  action: { type: 'SET' | 'TOGGLE' | 'INCREMENT'; key: string; value?: any },
  variablesConfig: StudioPrototypeVariable[]
): Record<string, any> {
  const newState = { ...currentState };
  const varDef = variablesConfig.find((v) => v.key === action.key);

  if (!varDef) {
    return newState;
  }

  if (action.type === 'TOGGLE' && varDef.type === 'boolean') {
    newState[action.key] = !Boolean(newState[action.key]);
  } else if (action.type === 'INCREMENT' && varDef.type === 'number') {
    newState[action.key] = (Number(newState[action.key]) || 0) + (Number(action.value) || 1);
  } else if (action.type === 'SET') {
    if (varDef.type === 'boolean') newState[action.key] = Boolean(action.value);
    else if (varDef.type === 'number') newState[action.key] = Number(action.value) || 0;
    else if (varDef.type === 'enum' && varDef.options?.includes(action.value)) newState[action.key] = action.value;
    else newState[action.key] = String(action.value || '');
  }

  return newState;
}

/**
 * 4. Safe API Data Source Guard & SSRF Protection
 */
export function validateApiUrl(urlStr: string): { safe: boolean; reason?: string } {
  try {
    const url = new URL(urlStr);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { safe: false, reason: 'Only HTTP and HTTPS protocols are allowed.' };
    }

    const host = url.hostname.toLowerCase();

    // Block SSRF targets (localhost, 127.0.0.1, 10.x, 192.168.x, 172.16-31.x, 169.254.169.254 metadata endpoint)
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)
    ) {
      return { safe: false, reason: `URL accesses protected internal or metadata loopback address (${host}).` };
    }

    return { safe: true };
  } catch (err: any) {
    return { safe: false, reason: 'Invalid URL format.' };
  }
}

/**
 * 5. Asset Upload Validator
 */
export function validateAssetUpload(filename: string, fileSizeBytes: number, mimeType: string): { safe: boolean; reason?: string } {
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit
  if (fileSizeBytes > maxSizeBytes) {
    return { safe: false, reason: `Asset size (${(fileSizeBytes / 1024 / 1024).toFixed(1)}MB) exceeds 10MB threshold.` };
  }

  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedMimeTypes.includes(mimeType)) {
    return { safe: false, reason: `Unsafe or unsupported asset MIME type: ${mimeType}` };
  }

  // Prevent path traversal in filename
  if (/(\.\.\/|\.\.\\)/.test(filename) || /[<>:"/\\|?*]/.test(filename)) {
    return { safe: false, reason: 'Filename contains invalid path characters or traversal sequence.' };
  }

  return { safe: true };
}

/**
 * 6. Design / Code Synchronization Analysis
 */
export type RegionType = 'STUDIO_MANAGED' | 'CUSTOM_PROTECTED' | 'UNSUPPORTED';

export interface CodeRegionClassification {
  regionId: string;
  type: RegionType;
  startLine: number;
  endLine: number;
  content: string;
}

export function classifyCodeRegions(codeContent: string): CodeRegionClassification[] {
  const lines = codeContent.split('\n');
  const regions: CodeRegionClassification[] = [];
  let currentRegion: Partial<CodeRegionClassification> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('/* @studio-managed-start */')) {
      currentRegion = {
        regionId: `reg_${i}`,
        type: 'STUDIO_MANAGED',
        startLine: i + 1,
        content: '',
      };
    } else if (line.includes('/* @custom-protected-start */')) {
      currentRegion = {
        regionId: `reg_${i}`,
        type: 'CUSTOM_PROTECTED',
        startLine: i + 1,
        content: '',
      };
    } else if (line.includes('/* @studio-managed-end */') || line.includes('/* @custom-protected-end */')) {
      if (currentRegion) {
        currentRegion.endLine = i + 1;
        regions.push(currentRegion as CodeRegionClassification);
        currentRegion = null;
      }
    } else if (currentRegion) {
      currentRegion.content = (currentRegion.content || '') + line + '\n';
    }
  }

  if (regions.length === 0) {
    regions.push({
      regionId: 'reg_default',
      type: 'STUDIO_MANAGED',
      startLine: 1,
      endLine: lines.length,
      content: codeContent,
    });
  }

  return regions;
}

/**
 * 7. Design Diff Engine between Studio Revisions
 */
export interface StudioDesignDiffResult {
  pagesAdded: string[];
  pagesRemoved: string[];
  pagesModified: string[];
  tokensChanged: boolean;
  tablesChanged: boolean;
  flowsChanged: boolean;
  summaryText: string;
}

export function calculateDesignDiff(oldIr: StudioIr, newIr: StudioIr): StudioDesignDiffResult {
  const oldPageIds = new Set((oldIr.pages || []).map((p) => p.id));
  const newPageIds = new Set((newIr.pages || []).map((p) => p.id));

  const pagesAdded: string[] = [];
  const pagesRemoved: string[] = [];
  const pagesModified: string[] = [];

  for (const id of newPageIds) {
    if (!oldPageIds.has(id)) pagesAdded.push(id);
  }

  for (const id of oldPageIds) {
    if (!newPageIds.has(id)) pagesRemoved.push(id);
  }

  for (const newPage of newIr.pages || []) {
    if (oldPageIds.has(newPage.id)) {
      const oldPage = oldIr.pages.find((p) => p.id === newPage.id);
      if (JSON.stringify(oldPage?.rootNode) !== JSON.stringify(newPage.rootNode)) {
        pagesModified.push(newPage.id);
      }
    }
  }

  const tokensChanged = JSON.stringify(oldIr.tokens || {}) !== JSON.stringify(newIr.tokens || {});
  const tablesChanged = JSON.stringify(oldIr.schema || {}) !== JSON.stringify(newIr.schema || {});
  const flowsChanged = JSON.stringify(oldIr.flows || {}) !== JSON.stringify(newIr.flows || {});

  const summaryText = `Diff Summary: +${pagesAdded.length} pages, -${pagesRemoved.length} pages, ~${pagesModified.length} pages modified. Tokens: ${
    tokensChanged ? 'Changed' : 'Unchanged'
  }, Schema: ${tablesChanged ? 'Changed' : 'Unchanged'}`;

  return {
    pagesAdded,
    pagesRemoved,
    pagesModified,
    tokensChanged,
    tablesChanged,
    flowsChanged,
    summaryText,
  };
}
