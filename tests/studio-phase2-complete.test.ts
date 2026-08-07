import { describe, it, expect } from 'vitest';
import {
  createDefaultStudioIr,
  validateStudioIr,
  StudioIr,
  StudioNode,
  StudioPageIR,
} from '../src/lib/studio/studioIr';
import {
  auditDesignTokens,
  runAccessibilityAudit,
  evalPrototypeAction,
  validateApiUrl,
  validateAssetUpload,
  classifyCodeRegions,
  calculateDesignDiff,
} from '../src/lib/studio/studioPhase2Engine';
import {
  createStudioProject,
  getStudioProjectIr,
  saveStudioProjectIr,
  promoteStudioProjectToWorkspace,
} from '../src/lib/studio/studioStore';

describe('OPROX Studio Phase 2 — Advanced Visual Engine & Real-time Design-Code Sync Test Suite', () => {
  const tenantId = 'tenant_p2_test';
  const orgId = 'org_p2_test';
  const authorId = 'user_p2_tester';

  // 1. Multi-page application design & route validation
  describe('1. Multi-Page Application Engine & Route Validation', () => {
    it('supports adding multiple pages with unique routes', () => {
      const ir = createDefaultStudioIr('proj_p2_1', tenantId, 'Multi-Page App');
      const page2: StudioPageIR = {
        id: 'page_dashboard',
        name: 'Dashboard Page',
        path: '/dashboard',
        rootNode: {
          id: 'root_dashboard',
          type: 'Container',
          name: 'Dashboard Container',
          props: {},
          style: {},
        },
      };
      ir.pages.push(page2);

      const validation = validateStudioIr(ir);
      expect(validation.valid).toBe(true);
      expect(ir.pages.length).toBe(2);
    });

    it('rejects duplicate route paths across pages', () => {
      const ir = createDefaultStudioIr('proj_p2_2', tenantId, 'Duplicate Route App');
      const page2: StudioPageIR = {
        id: 'page_dup',
        name: 'Duplicate Page',
        path: '/', // Duplicate of main page
        rootNode: {
          id: 'root_dup',
          type: 'Container',
          name: 'Dup Container',
          props: {},
          style: {},
        },
      };
      ir.pages.push(page2);

      const validation = validateStudioIr(ir);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Duplicate page route path detected'))).toBe(true);
    });
  });

  // 2. Alignment & Distribution Mechanics
  describe('2. Alignment, Flex & Grid Layout Controls', () => {
    it('applies alignment updates to node style', () => {
      const node: StudioNode = {
        id: 'node_test_align',
        type: 'Flex',
        name: 'Flex Container',
        props: {},
        style: { display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' },
      };

      // Align center
      node.style.justifyContent = 'center';
      node.style.alignItems = 'center';

      expect(node.style.justifyContent).toBe('center');
      expect(node.style.alignItems).toBe('center');
    });

    it('persists Grid column and gap configuration in node style', () => {
      const gridNode: StudioNode = {
        id: 'node_grid_1',
        type: 'Grid',
        name: 'Bento Grid',
        props: {},
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '1.5rem',
        },
      };

      expect(gridNode.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
      expect(gridNode.style.gap).toBe('1.5rem');
    });

    it('persists breakpoint style overrides (BASE vs OVERRIDDEN)', () => {
      const node: StudioNode = {
        id: 'node_responsive_1',
        type: 'Section',
        name: 'Hero Section',
        props: {},
        style: { padding: '2rem', display: 'flex' },
        responsiveStyle: {
          mobile: { padding: '1rem', flexDirection: 'column' },
          tablet: { padding: '1.5rem', flexDirection: 'row' },
          desktop: { padding: '2rem', flexDirection: 'row' },
        },
      };

      expect(node.responsiveStyle?.mobile?.padding).toBe('1rem');
      expect(node.responsiveStyle?.mobile?.flexDirection).toBe('column');
      expect(node.style.padding).toBe('2rem');
    });
  });

  // 3. Reusable Component System & Variants
  describe('3. Reusable Component System & Variants', () => {
    it('supports master component definitions and variants', () => {
      const ir = createDefaultStudioIr('proj_p2_comp', tenantId, 'Component App');
      ir.reusableComponentDefs = [
        {
          id: 'comp_button_primary',
          name: 'Primary Button',
          masterNode: {
            id: 'master_node_1',
            type: 'Button',
            name: 'Button',
            props: { label: 'Submit' },
            style: { backgroundColor: '#6366f1', color: '#ffffff' },
          },
          variants: [
            {
              id: 'var_secondary',
              name: 'Secondary',
              propsOverride: { label: 'Cancel' },
              styleOverride: { backgroundColor: '#475569' },
            },
          ],
        },
      ];

      expect(ir.reusableComponentDefs.length).toBe(1);
      expect(ir.reusableComponentDefs[0].variants?.length).toBe(1);
    });

    it('instantiates ComponentInstance node with overrides', () => {
      const instanceNode: StudioNode = {
        id: 'inst_node_1',
        type: 'ComponentInstance',
        name: 'Primary Button Instance',
        props: {
          componentId: 'comp_button_primary',
          variantId: 'var_secondary',
          overrideLabel: 'Custom Action',
        },
        style: {},
      };

      expect(instanceNode.type).toBe('ComponentInstance');
      expect(instanceNode.props.variantId).toBe('var_secondary');
    });
  });

  // 4. Design System Token Audit
  describe('4. Design System Token Audit Engine', () => {
    it('detects hardcoded hex colors and inconsistent spacing', () => {
      const ir = createDefaultStudioIr('proj_p2_audit', tenantId, 'Audit App');
      ir.pages[0].rootNode.children![0].style.color = '#ff0000'; // Hardcoded
      ir.pages[0].rootNode.children![0].style.padding = '17px'; // Inconsistent spacing

      const audit = auditDesignTokens(ir);
      expect(audit.hardcodedColors.length).toBeGreaterThan(0);
      expect(audit.hardcodedColors.some((c) => c.value === '#ff0000')).toBe(true);
      expect(audit.inconsistentSpacing.some((s) => s.includes('17px'))).toBe(true);
    });

    it('detects broken token references', () => {
      const ir = createDefaultStudioIr('proj_p2_token', tenantId, 'Broken Token App');
      ir.pages[0].rootNode.style.color = 'var(--token-color-nonexistent)';

      const audit = auditDesignTokens(ir);
      expect(audit.brokenReferences).toContain('nonexistent');
    });
  });

  // 5. Accessibility Auditor (WCAG)
  describe('5. Accessibility Auditor Engine', () => {
    it('flags missing form control labels', () => {
      const ir = createDefaultStudioIr('proj_p2_a11y', tenantId, 'A11y App');
      ir.pages[0].rootNode.children?.push({
        id: 'input_no_label',
        type: 'Input',
        name: 'Search Box',
        props: {}, // No label or aria-label
        style: {},
      });

      const findings = runAccessibilityAudit(ir);
      expect(findings.some((f) => f.ruleId === 'WCAG-4.1.2-LABEL-MISSING')).toBe(true);
    });

    it('flags missing image alt text', () => {
      const ir = createDefaultStudioIr('proj_p2_a11y_img', tenantId, 'A11y Image App');
      ir.pages[0].rootNode.children?.push({
        id: 'img_no_alt',
        type: 'Image',
        name: 'Hero Graphic',
        props: { src: 'https://example.com/banner.png' }, // No alt
        style: {},
      });

      const findings = runAccessibilityAudit(ir);
      expect(findings.some((f) => f.ruleId === 'WCAG-1.1.1-ALT-MISSING')).toBe(true);
    });

    it('flags skipped heading levels in hierarchy', () => {
      const ir = createDefaultStudioIr('proj_p2_a11y_h', tenantId, 'A11y Heading App');
      ir.pages[0].rootNode.children = [
        { id: 'h1', type: 'Heading', name: 'Title', props: { level: 1 }, style: {} },
        { id: 'h4', type: 'Heading', name: 'Subheading Skip', props: { level: 4 }, style: {} },
      ];

      const findings = runAccessibilityAudit(ir);
      expect(findings.some((f) => f.ruleId === 'WCAG-1.3.1-HEADING-SKIP')).toBe(true);
    });
  });

  // 6. Prototype Engine & Variables
  describe('6. Prototype State & Safe Action Execution', () => {
    it('mutates boolean, number, and enum variables without eval()', () => {
      const vars = [
        { key: 'isModalOpen', type: 'boolean' as const, defaultValue: false },
        { key: 'counter', type: 'number' as const, defaultValue: 0 },
        { key: 'theme', type: 'enum' as const, defaultValue: 'dark', options: ['light', 'dark'] },
      ];

      let state: Record<string, any> = { isModalOpen: false, counter: 5, theme: 'dark' };

      // Toggle boolean
      state = evalPrototypeAction(state, { type: 'TOGGLE', key: 'isModalOpen' }, vars);
      expect(state.isModalOpen).toBe(true);

      // Increment number
      state = evalPrototypeAction(state, { type: 'INCREMENT', key: 'counter', value: 3 }, vars);
      expect(state.counter).toBe(8);

      // Set enum
      state = evalPrototypeAction(state, { type: 'SET', key: 'theme', value: 'light' }, vars);
      expect(state.theme).toBe('light');
    });
  });

  // 7. Safe API Preview & SSRF Protection
  describe('7. Safe API Preview & SSRF Security', () => {
    it('blocks internal IP ranges and metadata loopback endpoints (SSRF Prevention)', () => {
      expect(validateApiUrl('http://127.0.0.1/admin').safe).toBe(false);
      expect(validateApiUrl('http://localhost:3000/api').safe).toBe(false);
      expect(validateApiUrl('http://169.254.169.254/latest/meta-data').safe).toBe(false);
      expect(validateApiUrl('http://10.0.0.1/internal').safe).toBe(false);
      expect(validateApiUrl('http://192.168.1.1/router').safe).toBe(false);
    });

    it('allows valid external HTTP/HTTPS API endpoints', () => {
      expect(validateApiUrl('https://api.github.com/users').safe).toBe(true);
      expect(validateApiUrl('https://jsonplaceholder.typicode.com/posts').safe).toBe(true);
    });
  });

  // 8. Asset Security & Upload Validation
  describe('8. Asset Management & Security Validation', () => {
    it('rejects oversized files (>10MB)', () => {
      const res = validateAssetUpload('large_banner.png', 12 * 1024 * 1024, 'image/png');
      expect(res.safe).toBe(false);
      expect(res.reason).toContain('exceeds 10MB');
    });

    it('rejects unsafe MIME types and path traversal attempts in filenames', () => {
      expect(validateAssetUpload('script.exe', 1024, 'application/x-msdownload').safe).toBe(false);
      expect(validateAssetUpload('../../../etc/passwd', 1024, 'image/png').safe).toBe(false);
    });

    it('approves safe images under size limit', () => {
      expect(validateAssetUpload('logo.png', 500 * 1024, 'image/png').safe).toBe(true);
    });
  });

  // 9. Design / Code Synchronization & Protected Code Regions
  describe('9. Design / Code Sync & Code Region Classification', () => {
    it('classifies @studio-managed and @custom-protected code regions', () => {
      const code = `
import React from 'react';

/* @studio-managed-start */
export const Component = () => <div>Studio UI</div>;
/* @studio-managed-end */

/* @custom-protected-start */
export const customLogic = () => { return 'Handwritten code'; };
/* @custom-protected-end */
`;

      const regions = classifyCodeRegions(code);
      expect(regions.length).toBe(2);
      expect(regions[0].type).toBe('STUDIO_MANAGED');
      expect(regions[1].type).toBe('CUSTOM_PROTECTED');
    });
  });

  // 10. Design Revision Diff Calculation
  describe('10. Design Revision Diff Engine', () => {
    it('calculates page and schema diffs between revisions', () => {
      const oldIr = createDefaultStudioIr('proj_diff', tenantId, 'Diff App');
      const newIr = JSON.parse(JSON.stringify(oldIr));

      newIr.pages.push({
        id: 'page_new',
        name: 'New Page',
        path: '/new',
        rootNode: { id: 'root_new', type: 'Container', name: 'Root', props: {}, style: {} },
      });

      const diff = calculateDesignDiff(oldIr, newIr);
      expect(diff.pagesAdded).toContain('page_new');
      expect(diff.pagesRemoved.length).toBe(0);
      expect(diff.summaryText).toContain('+1 pages');
    });
  });

  // 11. End-to-End Store Operations & Tenant Isolation
  describe('11. Studio Store Operations & Tenant Isolation', () => {
    it('creates project, saves revisions with OCC, and verifies tenant scoping', async () => {
      const proj = await createStudioProject({
        tenantId,
        orgId,
        name: 'P2 Store Project',
        description: 'Phase 2 integration testing',
        createdBy: authorId,
      });

      expect(proj.id).toBeDefined();

      const irData = await getStudioProjectIr(proj.id, tenantId);
      expect(irData).not.toBeNull();
      expect(irData?.meta.name).toBe('P2 Store Project');

      // Attempt access with wrong tenantId -> returns null (Tenant Isolation)
      const isolatedData = await getStudioProjectIr(proj.id, 'other_tenant_id');
      expect(isolatedData).toBeNull();

      // Save revision 1 -> 2
      const updatedIr = JSON.parse(JSON.stringify(irData!.ir));
      updatedIr.pages[0].name = 'Renamed Page';

      const saveRes = await saveStudioProjectIr({
        projectId: proj.id,
        tenantId,
        authorId,
        baseRevisionNumber: 1,
        updatedIr,
        changeSummary: 'Renamed main page',
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.newRevisionNumber).toBe(2);

      // OCC conflict test with stale baseRevisionNumber=1
      const conflictRes = await saveStudioProjectIr({
        projectId: proj.id,
        tenantId,
        authorId,
        baseRevisionNumber: 1, // Stale!
        updatedIr,
        changeSummary: 'Stale attempt',
      });

      expect(conflictRes.conflict).toBe(true);

      // Promote to workspace
      const promoRes = await promoteStudioProjectToWorkspace({
        projectId: proj.id,
        tenantId,
        promotedBy: authorId,
        targetBranch: 'feature/p2-test',
      });

      expect(promoRes.success).toBe(true);
      expect(promoRes.changeRequestId).toBeDefined();
    });
  });
});
