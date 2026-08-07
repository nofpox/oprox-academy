/**
 * OPROX Studio Phase 1 — Studio Intermediate Representation (IR) Specification
 * Authoritative, versioned JSON schema model representing visual application state.
 */

export const STUDIO_IR_VERSION = '1.0.0';

export type StudioComponentType =
  | 'Container'
  | 'Section'
  | 'Grid'
  | 'Flex'
  | 'Text'
  | 'Heading'
  | 'Button'
  | 'Input'
  | 'Textarea'
  | 'Select'
  | 'Checkbox'
  | 'Card'
  | 'Table'
  | 'Image'
  | 'Divider'
  | 'Badge'
  | 'ComponentInstance'
  | 'Form'
  | 'Modal'
  | 'Drawer'
  | 'Tabs'
  | 'Accordion';

export interface StudioPrototypeVariable {
  key: string;
  type: 'boolean' | 'string' | 'number' | 'enum';
  defaultValue: any;
  options?: string[]; // for enum
}

export interface StudioDataSourceDefinition {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  reqSchema?: Record<string, any>;
  resSchema?: Record<string, any>;
}

export interface StudioComponentVariant {
  id: string;
  name: string;
  propsOverride: Record<string, any>;
  styleOverride: Record<string, any>;
}

export interface StudioReusableComponentDef {
  id: string;
  name: string;
  category?: string;
  masterNode: StudioNode;
  variants?: StudioComponentVariant[];
}

export interface StudioAccessibilityFinding {
  id: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  nodeId?: string;
  nodeName?: string;
  ruleId: string;
  message: string;
  recommendation: string;
}

export interface StudioResponsiveOverride {
  width?: string;
  height?: string;
  padding?: string;
  margin?: string;
  gap?: string;
  fontSize?: string;
  display?: string;
  flexDirection?: string;
  gridTemplateColumns?: string;
  hidden?: boolean;
}

export interface StudioNodeBindings {
  onClickFlowId?: string;
  onSubmitFlowId?: string;
  onChangeStateKey?: string;
  customEventHandlers?: Record<string, string>;
}

export interface StudioNode {
  id: string;
  type: StudioComponentType;
  name: string;
  props: Record<string, any>;
  style: Record<string, any>;
  responsiveStyle?: {
    mobile?: StudioResponsiveOverride;
    tablet?: StudioResponsiveOverride;
    desktop?: StudioResponsiveOverride;
  };
  bindings?: StudioNodeBindings;
  children?: StudioNode[];
}

export interface StudioDesignTokens {
  colors: Record<string, string>;
  foregrounds: Record<string, string>;
  backgrounds: Record<string, string>;
  borders: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, string>;
  };
  shadows: Record<string, string>;
}

export interface StudioSchemaColumn {
  name: string;
  type: 'integer' | 'text' | 'boolean' | 'timestamp' | 'numeric' | 'jsonb' | 'uuid';
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  referencesTable?: string;
  referencesColumn?: string;
}

export interface StudioSchemaTable {
  name: string;
  columns: StudioSchemaColumn[];
  indexes?: { name: string; columns: string[]; unique?: boolean }[];
}

export interface StudioSchemaModel {
  tables: StudioSchemaTable[];
}

export type StudioFlowNodeKind =
  | 'TRIGGER'
  | 'ACTION'
  | 'API_REQUEST'
  | 'STATE_UPDATE'
  | 'NAVIGATION'
  | 'CONDITION'
  | 'AI_AGENT'
  | 'FORM_SUBMIT';

export interface StudioFlowNode {
  id: string;
  kind: StudioFlowNodeKind;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface StudioFlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  conditionLabel?: string;
}

export interface StudioFlowGraph {
  nodes: StudioFlowNode[];
  edges: StudioFlowEdge[];
}

export interface StudioPageIR {
  id: string;
  name: string;
  path: string;
  rootNode: StudioNode;
}

export interface StudioIr {
  version: typeof STUDIO_IR_VERSION;
  project: {
    id: string;
    tenantId: string;
    name: string;
    framework: string;
  };
  tokens: StudioDesignTokens;
  pages: StudioPageIR[];
  schema: StudioSchemaModel;
  flows: StudioFlowGraph;
  reusableComponents: { id: string; name: string; rootNode: StudioNode }[];
  reusableComponentDefs?: StudioReusableComponentDef[];
  prototypeVariables?: StudioPrototypeVariable[];
  prototypeState?: Record<string, any>;
  dataSources?: StudioDataSourceDefinition[];
}

export const DEFAULT_DESIGN_TOKENS: StudioDesignTokens = {
  colors: {
    primary: '#6366f1',
    secondary: '#ec4899',
    accent: '#10b981',
    neutral: '#64748b',
  },
  foregrounds: {
    main: '#f8fafc',
    muted: '#94a3b8',
    dark: '#0f172a',
  },
  backgrounds: {
    canvas: '#090d16',
    panel: '#111827',
    card: '#1f2937',
  },
  borders: {
    default: '#374151',
    focus: '#6366f1',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    headingFont: 'Plus Jakarta Sans, sans-serif',
    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      bold: '700',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

export function createDefaultStudioIr(projectId: string, tenantId: string, projectName: string): StudioIr {
  const rootNode: StudioNode = {
    id: 'node_root_container',
    type: 'Container',
    name: 'Main Container',
    props: {},
    style: {
      padding: '2rem',
      backgroundColor: '#090d16',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    children: [
      {
        id: 'node_hero_section',
        type: 'Section',
        name: 'Hero Section',
        props: {},
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1rem',
          padding: '1.5rem',
          backgroundColor: '#111827',
          borderRadius: '0.75rem',
          border: '1px solid #374151',
        },
        children: [
          {
            id: 'node_heading_1',
            type: 'Heading',
            name: 'Welcome Heading',
            props: { text: projectName, level: 1 },
            style: { color: '#f8fafc', fontSize: '1.875rem', fontWeight: '700' },
          },
          {
            id: 'node_text_sub',
            type: 'Text',
            name: 'Subtitle',
            props: { text: 'Built visually with OPROX Studio Phase 1 Low-Code Platform.' },
            style: { color: '#94a3b8', fontSize: '1rem' },
          },
          {
            id: 'node_cta_button',
            type: 'Button',
            name: 'Get Started Button',
            props: { label: 'Explore Studio Workspace', variant: 'primary' },
            style: {
              backgroundColor: '#6366f1',
              color: '#ffffff',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
            },
            bindings: { onClickFlowId: 'flow_welcome_action' },
          },
        ],
      },
    ],
  };

  return {
    version: STUDIO_IR_VERSION,
    project: {
      id: projectId,
      tenantId,
      name: projectName,
      framework: 'react_tailwind',
    },
    tokens: DEFAULT_DESIGN_TOKENS,
    pages: [
      {
        id: 'page_main',
        name: 'Main Page',
        path: '/',
        rootNode,
      },
    ],
    schema: {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'text', isPrimaryKey: true },
            { name: 'email', type: 'text', isNullable: false, isUnique: true },
            { name: 'full_name', type: 'text', isNullable: true },
            { name: 'created_at', type: 'timestamp', defaultValue: 'now()' },
          ],
        },
      ],
    },
    flows: {
      nodes: [
        {
          id: 'node_trigger_click',
          kind: 'TRIGGER',
          label: 'Button Clicked',
          config: { componentId: 'node_cta_button' },
          position: { x: 50, y: 100 },
        },
        {
          id: 'node_action_toast',
          kind: 'ACTION',
          label: 'Show Welcome Toast',
          config: { message: 'OPROX Studio visual flow executed!' },
          position: { x: 300, y: 100 },
        },
      ],
      edges: [
        {
          id: 'edge_click_to_toast',
          sourceId: 'node_trigger_click',
          targetId: 'node_action_toast',
        },
      ],
    },
    reusableComponents: [],
  };
}

/**
 * Strict IR Validation Engine
 * Validates versioning, depth limit, node count, attribute integrity, script injection security.
 */
export function validateStudioIr(ir: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ir || typeof ir !== 'object') {
    return { valid: false, errors: ['Studio IR must be a non-null object.'] };
  }

  if (ir.version !== STUDIO_IR_VERSION) {
    errors.push(`Invalid IR version: expected ${STUDIO_IR_VERSION}, got ${ir.version}`);
  }

  if (!ir.project || typeof ir.project !== 'object' || !ir.project.id || !ir.project.tenantId) {
    errors.push('Studio IR project metadata is missing or invalid.');
  }

  if (!ir.tokens || typeof ir.tokens !== 'object' || !ir.tokens.colors) {
    errors.push('Studio IR tokens configuration is missing or invalid.');
  }

  if (!Array.isArray(ir.pages) || ir.pages.length === 0) {
    errors.push('Studio IR must contain at least one page.');
  } else {
    let totalNodes = 0;
    const allowedNodeTypes: StudioComponentType[] = [
      'Container',
      'Section',
      'Grid',
      'Flex',
      'Text',
      'Heading',
      'Button',
      'Input',
      'Textarea',
      'Select',
      'Checkbox',
      'Card',
      'Table',
      'Image',
      'Divider',
      'Badge',
      'ComponentInstance',
      'Form',
      'Modal',
      'Drawer',
      'Tabs',
      'Accordion',
    ];

    const paths = new Set<string>();
    for (const page of ir.pages) {
      if (paths.has(page.path)) {
        errors.push(`Duplicate page route path detected: ${page.path}`);
      }
      paths.add(page.path);
    }

    function validateNode(node: any, depth: number, pageId: string) {
      if (!node || typeof node !== 'object') {
        errors.push(`Page [${pageId}] contains non-object node at depth ${depth}`);
        return;
      }

      totalNodes++;
      if (totalNodes > 1000) {
        errors.push(`Studio IR exceeds maximum node capacity (1000 nodes limit).`);
        return;
      }

      if (depth > 20) {
        errors.push(`Page [${pageId}] exceeds maximum component nesting depth of 20.`);
        return;
      }

      if (!node.id || typeof node.id !== 'string') {
        errors.push(`Node missing string "id" at depth ${depth}`);
      }

      if (!node.type || !allowedNodeTypes.includes(node.type)) {
        errors.push(`Node [${node.id || 'unknown'}] has invalid component type: ${node.type}`);
      }

      // Security check: inspect props and style for script injection / dangerous payloads
      const serialized = JSON.stringify(node.props || {}) + JSON.stringify(node.style || {});
      if (/<script\b[^>]*>|javascript:|data:text\/html/i.test(serialized)) {
        errors.push(`Node [${node.id}] contains unsafe script injection or executable protocol.`);
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          validateNode(child, depth + 1, pageId);
        }
      }
    }

    for (const page of ir.pages) {
      if (!page.id || !page.rootNode) {
        errors.push(`Page missing required "id" or "rootNode".`);
        continue;
      }
      validateNode(page.rootNode, 1, page.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
