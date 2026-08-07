/**
 * OPROX Studio Phase 1 — Studio Bounded Code Importer
 * Reverse-parses React TypeScript JSX snippets into Studio IR subsets with compatibility status reporting.
 */

import { StudioIr, StudioNode, STUDIO_IR_VERSION, DEFAULT_DESIGN_TOKENS } from './studioIr';

export type ImportCompatibilityStatus = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'UNSUPPORTED';

export interface CodeImportResult {
  status: ImportCompatibilityStatus;
  message: string;
  importedIr?: Partial<StudioIr>;
  unsupportedConstructs?: string[];
}

export function importCodeToStudioSubset(
  code: string,
  projectId: string,
  tenantId: string
): CodeImportResult {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return {
      status: 'UNSUPPORTED',
      message: 'Code snippet is empty or invalid.',
      unsupportedConstructs: ['EMPTY_INPUT'],
    };
  }

  const unsupportedConstructs: string[] = [];

  // Detect unparseable or complex unsupported patterns
  if (/class\s+\w+\s+extends\s+React\.Component/i.test(code)) {
    unsupportedConstructs.push('CLASS_COMPONENTS');
  }
  if (/dangerouslySetInnerHTML/i.test(code)) {
    unsupportedConstructs.push('DANGEROUSLY_SET_INNER_HTML');
  }
  if (/<script\b[^>]*>/i.test(code)) {
    return {
      status: 'UNSUPPORTED',
      message: 'Code contains unsafe inline <script> tags and was rejected for security.',
      unsupportedConstructs: ['SCRIPT_INJECTION'],
    };
  }

  // Attempt lightweight AST/regex JSX extraction
  const childrenNodes: StudioNode[] = [];
  let nodeCounter = 1;

  // Extract headings
  const headingMatches = code.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
  for (const hMatch of headingMatches) {
    const textMatch = hMatch.replace(/<[^>]+>/g, '').trim();
    const levelMatch = hMatch.match(/<h([1-6])/i);
    const level = levelMatch ? parseInt(levelMatch[1], 10) : 1;

    childrenNodes.push({
      id: `imported_node_heading_${nodeCounter++}`,
      type: 'Heading',
      name: `Heading (${textMatch.slice(0, 20)})`,
      props: { text: textMatch, level },
      style: { color: '#f8fafc', fontSize: level === 1 ? '1.875rem' : '1.25rem' },
    });
  }

  // Extract buttons
  const buttonMatches = code.match(/<button[^>]*>(.*?)<\/button>/gi) || [];
  for (const bMatch of buttonMatches) {
    const textMatch = bMatch.replace(/<[^>]+>/g, '').trim();
    childrenNodes.push({
      id: `imported_node_btn_${nodeCounter++}`,
      type: 'Button',
      name: `Button (${textMatch.slice(0, 20)})`,
      props: { label: textMatch || 'Button' },
      style: { backgroundColor: '#6366f1', color: '#ffffff', padding: '0.5rem 1rem' },
    });
  }

  // Extract paragraphs
  const pMatches = code.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
  for (const pMatch of pMatches) {
    const textMatch = pMatch.replace(/<[^>]+>/g, '').trim();
    childrenNodes.push({
      id: `imported_node_text_${nodeCounter++}`,
      type: 'Text',
      name: `Text (${textMatch.slice(0, 20)})`,
      props: { text: textMatch },
      style: { color: '#94a3b8' },
    });
  }

  // If no JSX components were matched, return PARTIALLY_SUPPORTED or UNSUPPORTED
  if (childrenNodes.length === 0) {
    if (/useEffect|useLayoutEffect|useReducer/i.test(code)) {
      unsupportedConstructs.push('COMPLEX_REACT_HOOKS');
    }
    return {
      status: 'PARTIALLY_SUPPORTED',
      message: 'Code imported as fallback container with static code preview node.',
      unsupportedConstructs: unsupportedConstructs.length > 0 ? unsupportedConstructs : ['GENERIC_JS_LOGIC'],
      importedIr: {
        version: STUDIO_IR_VERSION,
        tokens: DEFAULT_DESIGN_TOKENS,
        pages: [
          {
            id: 'page_imported',
            name: 'Imported Code Page',
            path: '/imported',
            rootNode: {
              id: 'node_imported_root',
              type: 'Container',
              name: 'Imported Container',
              props: {},
              style: { padding: '2rem', backgroundColor: '#090d16' },
              children: [
                {
                  id: 'node_imported_fallback_text',
                  type: 'Text',
                  name: 'Imported Raw Text',
                  props: { text: code.slice(0, 150) + '...' },
                  style: { color: '#f8fafc' },
                },
              ],
            },
          },
        ],
      },
    };
  }

  const rootNode: StudioNode = {
    id: 'node_imported_root_container',
    type: 'Container',
    name: 'Imported Layout Root',
    props: {},
    style: { padding: '2rem', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column', gap: '1rem' },
    children: childrenNodes,
  };

  const status: ImportCompatibilityStatus =
    unsupportedConstructs.length > 0 ? 'PARTIALLY_SUPPORTED' : 'SUPPORTED';

  return {
    status,
    message:
      status === 'SUPPORTED'
        ? 'Code successfully imported into Studio IR components.'
        : `Code partially imported. Unsupported features: ${unsupportedConstructs.join(', ')}`,
    unsupportedConstructs,
    importedIr: {
      version: STUDIO_IR_VERSION,
      project: {
        id: projectId,
        tenantId,
        name: 'Imported Project',
        framework: 'react_tailwind',
      },
      tokens: DEFAULT_DESIGN_TOKENS,
      pages: [
        {
          id: 'page_imported',
          name: 'Imported Page',
          path: '/imported',
          rootNode,
        },
      ],
      schema: { tables: [] },
      flows: { nodes: [], edges: [] },
      reusableComponents: [],
    },
  };
}
