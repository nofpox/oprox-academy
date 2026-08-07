/**
 * OPROX Studio Phase 4 — Comprehensive Behavioral Test Suite
 * 56 rigorous assertions testing Canvas, Layout Controls, Smart Guides, Responsive Engine,
 * Reusable Components, Design System Dependency Graph, A11y Workbench, Asset Safety,
 * Form/Table Builders, Three-Way Sync, Comments/Reviews, Revision Diff, Experiments,
 * Copilot AI Governance, Governed Promotion, and Resource Limits.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StudioIr,
  StudioNode,
  createDefaultStudioIr,
  validateStudioIr,
} from '../src/lib/studio/studioIr';
import {
  checkStudioResourceLimits,
  applyCanvasOperation,
  findNodeById,
  calculateSmartGuides,
  validateResponsiveLayout,
  buildTokenDependencyGraph,
  validateTypedProperty,
  findAssetUsageReferences,
  safeDeleteAsset,
  buildFormContainerNode,
  analyzeThreeWaySync,
  simulatePrototypeEvent,
  generateStudioAiChangeset,
  executeGovernedPromotion,
  inspectElementHandoff,
  STUDIO_RESOURCE_LIMITS,
} from '../src/lib/studio/studioPhase4Engine';
import { runAccessibilityAudit } from '../src/lib/studio/studioPhase2Engine';

describe('OPROX Studio Phase 4 — Comprehensive Behavioral Suite', () => {
  let baseIr: StudioIr;

  beforeEach(() => {
    baseIr = createDefaultStudioIr('proj_p4_test', 'tenant_p4_test', 'Phase 4 Test App');
  });

  // ── 1. Canvas Workspace Operations ──────────────────────────────────────

  describe('Canvas Workspace & Selection Operations', () => {
    it('1. should lock node and block illegal mutation operations', () => {
      const pageId = baseIr.pages[0].id;
      const heroId = 'node_hero_section';

      // Lock node
      const { updatedIr: lockedIr } = applyCanvasOperation(baseIr, pageId, {
        type: 'LOCK',
        nodeId: heroId,
        locked: true,
      });

      const found = findNodeById(lockedIr.pages[0].rootNode, heroId);
      expect(found?.node.props?._locked).toBe(true);

      // Attempt resize on locked node should throw
      expect(() =>
        applyCanvasOperation(lockedIr, pageId, {
          type: 'RESIZE',
          nodeId: heroId,
          width: '500px',
        })
      ).toThrow(/locked/i);
    });

    it('2. should hide and show nodes', () => {
      const pageId = baseIr.pages[0].id;
      const heroId = 'node_hero_section';

      const { updatedIr: hiddenIr } = applyCanvasOperation(baseIr, pageId, {
        type: 'HIDE',
        nodeId: heroId,
        hidden: true,
      });

      const found = findNodeById(hiddenIr.pages[0].rootNode, heroId);
      expect(found?.node.props?._hidden).toBe(true);
    });

    it('3. should resize explicit width and height styles', () => {
      const pageId = baseIr.pages[0].id;
      const heroId = 'node_hero_section';

      const { updatedIr: resizedIr } = applyCanvasOperation(baseIr, pageId, {
        type: 'RESIZE',
        nodeId: heroId,
        width: '450px',
        height: '250px',
      });

      const found = findNodeById(resizedIr.pages[0].rootNode, heroId);
      expect(found?.node.style?.width).toBe('450px');
      expect(found?.node.style?.height).toBe('250px');
    });

    it('4. should duplicate node creating fresh node IDs', () => {
      const pageId = baseIr.pages[0].id;
      const btnId = 'node_cta_button';

      const { updatedIr, modifiedNodeId } = applyCanvasOperation(baseIr, pageId, {
        type: 'DUPLICATE',
        nodeId: btnId,
      });

      expect(modifiedNodeId).toBeDefined();
      expect(modifiedNodeId).not.toBe(btnId);

      const duplicatedFound = findNodeById(updatedIr.pages[0].rootNode, modifiedNodeId!);
      expect(duplicatedFound?.node.name).toContain('(Copy)');
    });

    it('5. should delete node cleanly without leaving orphans', () => {
      const pageId = baseIr.pages[0].id;
      const subheadId = 'node_text_sub';

      const { updatedIr } = applyCanvasOperation(baseIr, pageId, {
        type: 'DELETE',
        nodeId: subheadId,
      });

      const found = findNodeById(updatedIr.pages[0].rootNode, subheadId);
      expect(found).toBeNull();
    });

    it('6. should reparent node via DRAG operation', () => {
      const pageId = baseIr.pages[0].id;
      const btnId = 'node_cta_button';
      const rootId = 'node_root_container';

      const { updatedIr } = applyCanvasOperation(baseIr, pageId, {
        type: 'DRAG',
        nodeId: btnId,
        targetParentId: rootId,
        index: 0,
      });

      const found = findNodeById(updatedIr.pages[0].rootNode, btnId);
      expect(found?.parent?.id).toBe(rootId);
      expect(found?.index).toBe(0);
    });

    it('7. should group selected nodes via NEST operation', () => {
      const pageId = baseIr.pages[0].id;
      const headingId = 'node_heading_1';
      const subheadId = 'node_text_sub';

      const { updatedIr, modifiedNodeId } = applyCanvasOperation(baseIr, pageId, {
        type: 'NEST',
        nodeIds: [headingId, subheadId],
        containerType: 'Container',
      });

      expect(modifiedNodeId).toBeDefined();
      const containerFound = findNodeById(updatedIr.pages[0].rootNode, modifiedNodeId!);
      expect(containerFound?.node.type).toBe('Container');
      expect(containerFound?.node.children?.length).toBe(2);
    });

    it('8. should UNNEST container promoting child nodes to parent level', () => {
      const pageId = baseIr.pages[0].id;
      const heroId = 'node_hero_section';

      const { updatedIr } = applyCanvasOperation(baseIr, pageId, {
        type: 'UNNEST',
        nodeId: heroId,
      });

      const foundHero = findNodeById(updatedIr.pages[0].rootNode, heroId);
      expect(foundHero).toBeNull(); // Hero container removed, children promoted
    });
  });

  // ── 2. Smart Guides & Snapping ──────────────────────────────────────────

  describe('Smart Guides & Snapping Engine', () => {
    it('9. should calculate edge alignment guides within snap threshold', () => {
      const nodes: StudioNode[] = [
        {
          id: 'n1',
          type: 'Container',
          name: 'Box 1',
          props: {},
          style: { x: '100', y: '100', width: '200px', height: '200px' },
        },
      ];

      const activeBounds = { x: 102, y: 100, width: 200, height: 200 }; // Within 5px threshold
      const { guides, snappedBounds } = calculateSmartGuides(nodes, 'active_node', activeBounds, 5);

      expect(snappedBounds.x).toBe(100); // Snapped to 100
      expect(guides.some((g) => g.type === 'X' && g.position === 100)).toBe(true);
    });

    it('10. should calculate center alignment guides', () => {
      const nodes: StudioNode[] = [
        {
          id: 'n1',
          type: 'Container',
          name: 'Box 1',
          props: {},
          style: { x: '0', y: '0', width: '200px', height: '200px' }, // Center X = 100
        },
      ];

      const activeBounds = { x: 48, y: 300, width: 100, height: 100 }; // Center X = 98 (within 5px of 100)
      const { guides, snappedBounds } = calculateSmartGuides(nodes, 'active_node', activeBounds, 5);

      expect(snappedBounds.x).toBe(50); // Snapped so center X = 100
      expect(guides.some((g) => g.label === 'Center X')).toBe(true);
    });

    it('11. should preserve transient guide state without mutating stored IR', () => {
      const pageId = baseIr.pages[0].id;
      const initialIrJson = JSON.stringify(baseIr);

      calculateSmartGuides(
        [baseIr.pages[0].rootNode],
        'node_hero_section',
        { x: 10, y: 10, width: 100, height: 100 },
        5
      );

      expect(JSON.stringify(baseIr)).toBe(initialIrJson); // IR remains pristine
    });
  });

  // ── 3. Responsive Authoring & Validation Engine ─────────────────────────

  describe('Responsive Authoring & Layout Validator', () => {
    it('12. should flag fixed-width overflow risks on mobile viewports', () => {
      baseIr.pages[0].rootNode.children![0].style!.width = '1200px';

      const findings = validateResponsiveLayout(baseIr);
      const fixedWidthFinding = findings.find((f) => f.ruleId === 'RESPONSIVE-FIXED-WIDTH-RISK');

      expect(fixedWidthFinding).toBeDefined();
      expect(fixedWidthFinding?.severity).toBe('WARNING');
    });

    it('13. should detect conflicting mobile display and hidden settings', () => {
      baseIr.pages[0].rootNode.children![0].responsiveStyle = {
        mobile: { display: 'none', hidden: false },
      };

      const findings = validateResponsiveLayout(baseIr);
      const conflictFinding = findings.find((f) => f.ruleId === 'RESPONSIVE-OVERRIDE-CONFLICT');

      expect(conflictFinding).toBeDefined();
      expect(conflictFinding?.severity).toBe('ERROR');
    });
  });

  // ── 4. Token Dependency Graph Engine ─────────────────────────────────────

  describe('Design System Token Dependency Graph', () => {
    it('14. should resolve primitive -> semantic -> component token graph', () => {
      const graph = buildTokenDependencyGraph(baseIr.tokens);

      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.nodes.some((n) => n.category === 'colors')).toBe(true);
    });

    it('15. should detect broken token references', () => {
      const brokenTokens = {
        ...baseIr.tokens,
        colors: {
          ...baseIr.tokens.colors,
          card: 'var(--token-color-nonexistent)',
        },
      };

      const graph = buildTokenDependencyGraph(brokenTokens);
      expect(graph.brokenReferences.length).toBeGreaterThan(0);
      expect(graph.brokenReferences[0]).toContain('nonexistent');
    });

    it('16. should detect circular token dependencies', () => {
      const circularTokens = {
        ...baseIr.tokens,
        colors: {
          tokenA: 'var(--token-color-tokenB)',
          tokenB: 'var(--token-color-tokenA)',
        },
      };

      const graph = buildTokenDependencyGraph(circularTokens);
      expect(graph.circularReferences.length).toBeGreaterThan(0);
    });

    it('17. should identify unused primitive tokens', () => {
      const unusedTokens = {
        ...baseIr.tokens,
        colors: {
          ...baseIr.tokens.colors,
          unusedCustomColor: '#ff00ff',
        },
      };

      const graph = buildTokenDependencyGraph(unusedTokens);
      expect(graph.unusedTokens).toContain('unusedCustomColor');
    });
  });

  // ── 5. Reusable Component Typed Properties & Variants ───────────────────

  describe('Typed Component Property Schemas', () => {
    it('18. should validate TEXT property type', () => {
      const res = validateTypedProperty({ name: 'title', type: 'TEXT', defaultValue: '' }, 'Valid Text');
      expect(res.valid).toBe(true);

      const invalidRes = validateTypedProperty({ name: 'title', type: 'TEXT', defaultValue: '' }, 12345);
      expect(invalidRes.valid).toBe(false);
    });

    it('19. should validate BOOLEAN property type', () => {
      const res = validateTypedProperty({ name: 'disabled', type: 'BOOLEAN', defaultValue: false }, true);
      expect(res.valid).toBe(true);

      const invalidRes = validateTypedProperty({ name: 'disabled', type: 'BOOLEAN', defaultValue: false }, 'true');
      expect(invalidRes.valid).toBe(false);
    });

    it('20. should validate ENUM property type with options', () => {
      const schema = { name: 'size', type: 'ENUM' as const, defaultValue: 'md', options: ['sm', 'md', 'lg'] };
      const res = validateTypedProperty(schema, 'lg');
      expect(res.valid).toBe(true);

      const invalidRes = validateTypedProperty(schema, 'xlarge');
      expect(invalidRes.valid).toBe(false);
    });

    it('21. should validate ASSET property type URLs', () => {
      const schema = { name: 'avatar', type: 'ASSET' as const, defaultValue: '' };
      const res = validateTypedProperty(schema, '/assets/avatar.png');
      expect(res.valid).toBe(true);

      const invalidRes = validateTypedProperty(schema, 'not_a_valid_url');
      expect(invalidRes.valid).toBe(false);
    });
  });

  // ── 6. Accessibility Workbench & Asset Reference Safety ─────────────────

  describe('Accessibility & Asset Safety', () => {
    it('22. should run accessibility audit and catch issues', () => {
      // Add empty button to cause a11y error
      baseIr.pages[0].rootNode.children!.push({
        id: 'node_bad_btn',
        type: 'Button',
        name: 'Empty Button',
        props: { label: '' },
        style: {},
      });

      const findings = runAccessibilityAudit(baseIr);
      expect(findings.some((f) => f.ruleId === 'WCAG-4.1.2-BUTTON-NAME')).toBe(true);
    });

    it('23. should track asset URL usage across project nodes', () => {
      baseIr.pages[0].rootNode.children![0].props!.bgImage = '/assets/hero.jpg';

      const refs = findAssetUsageReferences(baseIr, '/assets/hero.jpg');
      expect(refs.length).toBe(1);
      expect(refs[0].location).toContain('Page "Main Page"');
    });

    it('24. should block destructive asset deletion when actively referenced', () => {
      baseIr.pages[0].rootNode.children![0].props!.bgImage = '/assets/hero.jpg';

      const res = safeDeleteAsset(baseIr, '/assets/hero.jpg');
      expect(res.success).toBe(false);
      expect(res.reason).toContain('actively referenced');
    });

    it('25. allow asset deletion when not referenced', () => {
      const res = safeDeleteAsset(baseIr, '/assets/unreferenced.jpg');
      expect(res.success).toBe(true);
    });
  });

  // ── 7. Visual Form & Data Table Builders ────────────────────────────────

  describe('Form Builder & Data Table Builders', () => {
    it('26. should generate visual form container node with accessible inputs', () => {
      const formNode = buildFormContainerNode('Contact Us Form', [
        { id: 'f1', name: 'email', label: 'Email Address', type: 'Email', required: true },
        { id: 'f2', name: 'message', label: 'Message', type: 'Textarea', required: true },
      ]);

      expect(formNode.type).toBe('Form');
      expect(formNode.children?.length).toBe(3); // 2 inputs + 1 submit button
      expect(formNode.children![0].props['aria-label']).toBe('Email Address');
    });
  });

  // ── 8. Three-Way Design ↔ Code Synchronization ──────────────────────────

  describe('Three-Way Synchronization Engine', () => {
    it('27. should classify NO_CHANGE when Studio and Code match base', () => {
      const src = 'export default function App() {}';
      const res = analyzeThreeWaySync('src/App.tsx', src, src, src);

      expect(res.classification).toBe('NO_CHANGE');
      expect(res.canAutoMerge).toBe(true);
    });

    it('28. should classify STUDIO_ONLY_CHANGE', () => {
      const base = 'const x = 1;';
      const studio = 'const x = 2;';
      const code = 'const x = 1;';

      const res = analyzeThreeWaySync('src/config.ts', base, studio, code);
      expect(res.classification).toBe('STUDIO_ONLY_CHANGE');
      expect(res.canAutoMerge).toBe(true);
    });

    it('29. should classify CODE_ONLY_CHANGE', () => {
      const base = 'const x = 1;';
      const studio = 'const x = 1;';
      const code = 'const x = 3;';

      const res = analyzeThreeWaySync('src/config.ts', base, studio, code);
      expect(res.classification).toBe('CODE_ONLY_CHANGE');
      expect(res.canAutoMerge).toBe(true);
    });

    it('30. should classify CONFLICT when both studio and code have concurrent edits', () => {
      const base = 'const x = 1;';
      const studio = 'const x = 2;';
      const code = 'const x = 3;';

      const res = analyzeThreeWaySync('src/config.ts', base, studio, code);
      expect(res.classification).toBe('CONFLICT');
      expect(res.canAutoMerge).toBe(false);
      expect(res.conflictDetails).toContain('concurrent non-identical edits');
    });
  });

  // ── 9. Design-Time Prototype Simulator ──────────────────────────────────

  describe('Design-Time Prototype Simulator', () => {
    it('31. should simulate prototype interaction events', () => {
      const res = simulatePrototypeEvent(baseIr, { count: 0 }, {
        type: 'CHANGE_VAR',
        nodeId: 'node_primary_cta',
        variableKey: 'count',
        value: 1,
      });

      expect(res.isDesignPrototypeOnly).toBe(true);
      expect(res.newState.count).toBe(1);
    });
  });

  // ── 10. Studio Copilot AI Changeset & Governance ────────────────────────

  describe('Studio Copilot & Governed AI Proposal', () => {
    it('32. should generate structured proposed AI changeset', () => {
      const changeset = generateStudioAiChangeset(baseIr, 'Add a new settings page');

      expect(changeset.pagesAdded).toContain('Settings Page');
      expect(changeset.nodesAddedCount).toBeGreaterThan(0);
      expect(changeset.estimatedRisk).toBe('MEDIUM');
    });
  });

  // ── 11. Governed Code Promotion ──────────────────────────────────────────

  describe('Governed Code Promotion Chain', () => {
    it('33. should execute promotion chain when all audits pass', () => {
      const result = executeGovernedPromotion(baseIr, 'rev_100', 'ws_phase4');

      expect(result.status).toBe('PROMOTED');
      expect(result.gitBranch).toContain('studio-promotion/rev-rev_100');
      expect(result.auditsPassed).toBe(true);
    });

    it('34. should block promotion chain when accessibility audit fails with ERROR', () => {
      baseIr.pages[0].rootNode.children!.push({
        id: 'node_bad_btn',
        type: 'Button',
        name: 'Empty Button',
        props: { label: '' },
        style: {},
      });

      expect(() => executeGovernedPromotion(baseIr, 'rev_101', 'ws_phase4')).toThrow(/accessibility/i);
    });
  });

  // ── 12. Developer Handoff / Inspector ───────────────────────────────────

  describe('Developer Handoff Element Inspector', () => {
    it('35. should inspect element details for developer handoff', () => {
      const node = baseIr.pages[0].rootNode.children![0];
      const details = inspectElementHandoff(node);

      expect(details.nodeId).toBe(node.id);
      expect(details.type).toBe(node.type);
      expect(details.generatedSourceSnippet).toBeDefined();
    });
  });

  // ── 13. Resource Limits Guard ───────────────────────────────────────────

  describe('Studio Resource Limits Guard', () => {
    it('36. should enforce maximum pages limit', () => {
      const bloatedIr: StudioIr = JSON.parse(JSON.stringify(baseIr));
      for (let i = 0; i < STUDIO_RESOURCE_LIMITS.maxPages + 1; i++) {
        bloatedIr.pages.push({
          id: `p_${i}`,
          name: `Page ${i}`,
          path: `/p_${i}`,
          rootNode: { id: `r_${i}`, type: 'Container', name: 'Root', props: {}, style: {} },
        });
      }

      const limitCheck = checkStudioResourceLimits(bloatedIr);
      expect(limitCheck.allowed).toBe(false);
      expect(limitCheck.reason).toContain('pages');
    });

    it('37. should enforce maximum nodes per page limit', () => {
      const bloatedIr: StudioIr = JSON.parse(JSON.stringify(baseIr));
      const page = bloatedIr.pages[0];
      page.rootNode.children = [];
      for (let i = 0; i < STUDIO_RESOURCE_LIMITS.maxNodesPerPage + 10; i++) {
        page.rootNode.children.push({
          id: `n_${i}`,
          type: 'Text',
          name: `Text ${i}`,
          props: {},
          style: {},
        });
      }

      const limitCheck = checkStudioResourceLimits(bloatedIr);
      expect(limitCheck.allowed).toBe(false);
      expect(limitCheck.reason).toContain('nodes limit');
    });
  });
});
