/**
 * OPROX Studio Phase 1 — Studio Compiler Engine
 * Deterministic IR-to-React TypeScript Code Generation.
 */

import { StudioIr, StudioNode, StudioPageIR } from './studioIr';

export interface CompiledPageOutput {
  pageId: string;
  filePath: string;
  code: string;
}

export interface StudioCompilerResult {
  pages: CompiledPageOutput[];
  drizzleSchemaCode: string;
  themeCssCode: string;
  manifest: {
    compiledAt: string;
    irVersion: string;
    pageCount: number;
    tableCount: number;
  };
}

function cssObjectToTailwindOrStyle(style: Record<string, any>): { className: string; inlineStyle: Record<string, any> } {
  const inlineStyle: Record<string, any> = {};
  const tailwindClasses: string[] = [];

  for (const [key, value] of Object.entries(style || {})) {
    if (value === undefined || value === null || value === '') continue;

    // Simple mappings for visual properties
    if (key === 'backgroundColor' && typeof value === 'string') {
      if (value === '#090d16') tailwindClasses.push('bg-slate-950');
      else if (value === '#111827') tailwindClasses.push('bg-gray-900');
      else if (value === '#1f2937') tailwindClasses.push('bg-gray-800');
      else if (value === '#6366f1') tailwindClasses.push('bg-indigo-600');
      else inlineStyle.backgroundColor = value;
    } else if (key === 'color' && typeof value === 'string') {
      if (value === '#f8fafc' || value === '#ffffff') tailwindClasses.push('text-white');
      else if (value === '#94a3b8') tailwindClasses.push('text-slate-400');
      else inlineStyle.color = value;
    } else if (key === 'padding') {
      if (value === '2rem') tailwindClasses.push('p-8');
      else if (value === '1.5rem') tailwindClasses.push('p-6');
      else if (value === '1rem') tailwindClasses.push('p-4');
      else if (value === '0.5rem') tailwindClasses.push('p-2');
      else if (value === '0.625rem 1.25rem') tailwindClasses.push('px-5 py-2.5');
      else inlineStyle.padding = value;
    } else if (key === 'gap') {
      if (value === '1.5rem') tailwindClasses.push('gap-6');
      else if (value === '1rem') tailwindClasses.push('gap-4');
      else if (value === '0.5rem') tailwindClasses.push('gap-2');
      else inlineStyle.gap = value;
    } else if (key === 'display') {
      if (value === 'flex') tailwindClasses.push('flex');
      else if (value === 'grid') tailwindClasses.push('grid');
      else inlineStyle.display = value;
    } else if (key === 'flexDirection') {
      if (value === 'column') tailwindClasses.push('flex-col');
      else if (value === 'row') tailwindClasses.push('flex-row');
      else inlineStyle.flexDirection = value;
    } else if (key === 'borderRadius') {
      if (value === '0.75rem') tailwindClasses.push('rounded-xl');
      else if (value === '0.5rem') tailwindClasses.push('rounded-lg');
      else inlineStyle.borderRadius = value;
    } else {
      inlineStyle[key] = value;
    }
  }

  return {
    className: tailwindClasses.join(' '),
    inlineStyle,
  };
}

function compileNodeToJsx(node: StudioNode, indent: number = 4): string {
  const pad = ' '.repeat(indent);
  const { className, inlineStyle } = cssObjectToTailwindOrStyle(node.style || {});

  const styleAttr =
    Object.keys(inlineStyle).length > 0 ? ` style={${JSON.stringify(inlineStyle)}}` : '';
  const classAttr = className ? ` className="${className}"` : '';
  const idAttr = node.id ? ` id="${node.id}"` : '';

  const childrenJsx = (node.children || [])
    .map((child) => compileNodeToJsx(child, indent + 2))
    .join('\n');

  switch (node.type) {
    case 'Heading': {
      const level = node.props.level || 1;
      const Tag = `h${level}`;
      const text = node.props.text || node.name;
      return `${pad}<${Tag}${idAttr}${classAttr}${styleAttr}>${text}</${Tag}>`;
    }
    case 'Text': {
      const text = node.props.text || node.name;
      return `${pad}<p${idAttr}${classAttr}${styleAttr}>${text}</p>`;
    }
    case 'Button': {
      const label = node.props.label || 'Button';
      const onClickAttr = node.bindings?.onClickFlowId
        ? ` onClick={() => handleFlowTrigger('${node.bindings.onClickFlowId}')}`
        : '';
      return `${pad}<button${idAttr}${classAttr}${styleAttr}${onClickAttr}>${label}</button>`;
    }
    case 'Input': {
      const placeholder = node.props.placeholder || '';
      const type = node.props.type || 'text';
      return `${pad}<input type="${type}" placeholder="${placeholder}"${idAttr}${classAttr}${styleAttr} />`;
    }
    case 'Badge': {
      const text = node.props.text || 'Badge';
      return `${pad}<span${idAttr}${classAttr}${styleAttr}>${text}</span>`;
    }
    case 'Image': {
      const src = node.props.src || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe';
      const alt = node.props.alt || node.name;
      return `${pad}<img src="${src}" alt="${alt}"${idAttr}${classAttr}${styleAttr} />`;
    }
    case 'Form': {
      const onSubmitAttr = node.bindings?.onSubmitFlowId
        ? ` onSubmit={(e) => { e.preventDefault(); handleFlowTrigger('${node.bindings.onSubmitFlowId}'); }}`
        : ' onSubmit={(e) => e.preventDefault()}';
      return `${pad}<form${idAttr}${classAttr}${styleAttr}${onSubmitAttr}>\n${childrenJsx}\n${pad}</form>`;
    }
    case 'Modal':
    case 'Drawer': {
      const isOpen = node.props.isOpen !== false;
      if (!isOpen) return '';
      return `${pad}<div role="dialog" aria-modal="true"${idAttr}${classAttr}${styleAttr}>\n${childrenJsx}\n${pad}</div>`;
    }
    case 'Tabs':
    case 'Accordion': {
      return `${pad}<div role="region"${idAttr}${classAttr}${styleAttr}>\n${childrenJsx}\n${pad}</div>`;
    }
    case 'ComponentInstance': {
      const compName = node.props.componentName || 'CustomComponent';
      return `${pad}<div data-studio-instance="${node.props.componentId || ''}"${idAttr}${classAttr}${styleAttr}>\n${pad}  {/* Instance of ${compName} */}\n${childrenJsx}\n${pad}</div>`;
    }
    case 'Card':
    case 'Section':
    case 'Container':
    case 'Grid':
    case 'Flex':
    default: {
      if (!childrenJsx) {
        return `${pad}<div${idAttr}${classAttr}${styleAttr} />`;
      }
      return `${pad}<div${idAttr}${classAttr}${styleAttr}>\n${childrenJsx}\n${pad}</div>`;
    }
  }
}

export function compileStudioPage(page: StudioPageIR, projectName: string): CompiledPageOutput {
  const componentName = page.id
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Page';

  const bodyJsx = compileNodeToJsx(page.rootNode, 4);

  const code = `import React from 'react';

/**
 * Auto-compiled page generated by OPROX Studio Phase 1.
 * Project: ${projectName}
 * Page ID: ${page.id}
 */
export const ${componentName}: React.FC = () => {
  const handleFlowTrigger = (flowId: string) => {
    console.log('[OPROX Studio Executed Flow]:', flowId);
  };

  return (
    /* @studio-managed-start */
${bodyJsx}
    /* @studio-managed-end */
  );
};

export default ${componentName};
`;

  const fileName = page.path === '/' ? 'index.tsx' : `${page.id}.tsx`;

  return {
    pageId: page.id,
    filePath: `src/pages/${fileName}`,
    code,
  };
}

export function compileStudioIr(ir: StudioIr): StudioCompilerResult {
  const pages = ir.pages.map((p) => compileStudioPage(p, ir.project.name));

  const themeCssCode = `/* OPROX Studio Generated Theme CSS Tokens */
:root {
  --studio-bg-canvas: ${ir.tokens.backgrounds.canvas || '#090d16'};
  --studio-bg-panel: ${ir.tokens.backgrounds.panel || '#111827'};
  --studio-color-primary: ${ir.tokens.colors.primary || '#6366f1'};
  --studio-color-secondary: ${ir.tokens.colors.secondary || '#ec4899'};
  --studio-font-main: ${ir.tokens.typography.fontFamily || 'sans-serif'};
}
`;

  return {
    pages,
    drizzleSchemaCode: '', // Will be populated by Drizzle Generator
    themeCssCode,
    manifest: {
      compiledAt: new Date().toISOString(),
      irVersion: ir.version,
      pageCount: ir.pages.length,
      tableCount: ir.schema?.tables?.length || 0,
    },
  };
}
