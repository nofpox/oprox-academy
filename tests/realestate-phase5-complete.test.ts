import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDesignProject,
  getDesignProject,
  listDesignProjects,
  updateDesignProject,
  deleteDesignProject,
  createDesignConcept,
  listDesignConcepts,
  getDesignConcept,
  updateConceptApproval,
  generateAiArchitectConcept,
  generateAiInteriorConcept,
  generateAiExteriorConcept,
  generateAiRenovationConcept,
  exportDesignProjectToStudio,
  calculateInvestmentMetrics,
  createInvestmentAnalysis,
  getInvestmentAnalysis,
  listInvestmentAnalyses,
  compareInvestments,
  askAiInvestmentAdvisor,
  ARCHITECTURAL_DISCLAIMER,
  RENOVATION_DISCLAIMER,
} from '../src/lib/realestate/realEstatePhase5Store';

describe('OPROX Real Estate Phase 5 — AI Architectural, Design & Investment Intelligence Suite', () => {
  const tenantA = 'tenant_phase5_alpha';
  const tenantB = 'tenant_phase5_beta';
  const user1 = 'usr_arch_01';

  it('1. Design Projects Workspace — CRUD & Multi-Tenant Isolation', async () => {
    // Create Project under Tenant A
    const projA = await createDesignProject({
      tenantId: tenantA,
      userId: user1,
      title: 'Al Olaya Luxury Commercial Villa',
      projectType: 'ARCHITECTURAL',
      requirementsJson: { areaSqm: 800, style: 'Saudi Modern' },
    });

    expect(projA.id).toMatch(/^dp_/);
    expect(projA.tenantId).toBe(tenantA);
    expect(projA.status).toBe('ACTIVE');

    // Retrieve Project under Tenant A -> Success
    const fetchedA = await getDesignProject(tenantA, projA.id);
    expect(fetchedA).not.toBeNull();
    expect(fetchedA?.title).toBe('Al Olaya Luxury Commercial Villa');

    // Attempt to retrieve under Tenant B -> Blocked (IDOR Protection)
    const fetchedB = await getDesignProject(tenantB, projA.id);
    expect(fetchedB).toBeNull();

    // List under Tenant A
    const listA = await listDesignProjects(tenantA);
    expect(listA.some((p) => p.id === projA.id)).toBe(true);

    // List under Tenant B -> Empty for Tenant B
    const listB = await listDesignProjects(tenantB);
    expect(listB.some((p) => p.id === projA.id)).toBe(false);

    // Update Project under Tenant A
    const updated = await updateDesignProject(tenantA, projA.id, {
      notes: 'Approved by board for schematic design phase.',
    });
    expect(updated?.notes).toContain('Approved by board');
  });

  it('2. Concept Versioning & Conceptual Notice Enforcement', async () => {
    const proj = await createDesignProject({
      tenantId: tenantA,
      userId: user1,
      title: 'Jeddah Corniche Penthouse',
      projectType: 'INTERIOR',
    });

    // Version 1 Concept
    const concept1 = await createDesignConcept({
      tenantId: tenantA,
      designProjectId: proj.id,
      conceptName: 'Concept A — Minimalist Sea View',
      conceptType: 'INTERIOR',
      style: 'Modern',
    });

    expect(concept1.versionNumber).toBe(1);
    expect(concept1.isConceptualNotice).toBe(true);

    // Version 2 Concept
    const concept2 = await createDesignConcept({
      tenantId: tenantA,
      designProjectId: proj.id,
      conceptName: 'Concept B — Coastal Warm Wood',
      conceptType: 'INTERIOR',
      style: 'Contemporary',
    });

    expect(concept2.versionNumber).toBe(2);

    // List concepts for project (ordered by version descending)
    const concepts = await listDesignConcepts(tenantA, proj.id);
    expect(concepts.length).toBe(2);
    expect(concepts[0].versionNumber).toBe(2);

    // Update approval status
    const approved = await updateConceptApproval(tenantA, concept2.id, 'APPROVED');
    expect(approved?.approvalStatus).toBe('APPROVED');
  });

  it('3. AI Architect Concept Generator & Disclaimer', async () => {
    const result = await generateAiArchitectConcept({
      tenantId: tenantA,
      userId: user1,
      title: 'Riyadh Diplomatic Quarter Estate',
      areaSqm: 600,
      plotDimensions: '20m x 30m',
      roomRequirements: '4 En-Suite Bedrooms, Family Living, Guest Majlis',
      floorsCount: 2,
      architecturalStyle: 'Saudi-inspired',
      usageType: 'RESIDENTIAL',
    });

    expect(result.project.id).toMatch(/^dp_/);
    expect(result.concept.conceptType).toBe('ARCHITECTURAL');
    expect(result.concept.isConceptualNotice).toBe(true);
    const spaceData = result.concept.spacePlanningJson as any;
    expect(spaceData?.functionalZones).toBeDefined();
    expect(spaceData.functionalZones.length).toBeGreaterThan(0);
    const spatialMeta = result.concept.spatialMetaJson as any;
    expect(spatialMeta?.digitalTwinReady).toBe(true);
  });

  it('4. AI Interior Designer Workflows & Color Palette Swatches', async () => {
    const result = await generateAiInteriorConcept({
      tenantId: tenantA,
      userId: user1,
      spaceType: 'LIVING_ROOM',
      style: 'Saudi-inspired',
    });

    expect(result.concept.conceptType).toBe('INTERIOR');
    const intDetails = result.concept.interiorDetailsJson as any;
    expect(intDetails?.colorPalette).toBeDefined();
    expect(intDetails.colorPalette.length).toBeGreaterThan(0);
    expect(intDetails.colorPalette[0].hex).toMatch(/^#/);
    expect(intDetails?.visualGenerationProviderStatus).toBe('NOT_CONFIGURED');
  });

  it('5. AI Exterior & Landscape Designer Workflows', async () => {
    const result = await generateAiExteriorConcept({
      tenantId: tenantA,
      userId: user1,
      facadeStyle: 'Modern',
      includePool: true,
      includeGarden: true,
    });

    expect(result.concept.conceptType).toBe('EXTERIOR');
    const extDetails = result.concept.exteriorDetailsJson as any;
    expect(extDetails?.landscapeZoning).toBeDefined();
    expect(extDetails.landscapeZoning.length).toBeGreaterThan(0);
  });

  it('6. AI Renovation Advisor & Estimated Value Uplift Scenario', async () => {
    const result = await generateAiRenovationConcept({
      tenantId: tenantA,
      userId: user1,
      areaSqm: 400,
      propertyAgeYears: 15,
      currentCondition: 'FAIR',
      desiredRenovationScope: 'FACADE_AND_INTERIOR',
      budgetSar: 400000,
    });

    expect(result.concept.conceptType).toBe('RENOVATION');
    const renData = result.concept.renovationDetailsJson as any;
    expect(renData?.isEstimate).toBe(true);
    expect(renData?.disclaimer).toBe(RENOVATION_DISCLAIMER);
    expect(renData?.estimatedBudgetRangeSar?.minSar).toBeGreaterThan(0);
    expect(renData?.estimatedBudgetRangeSar?.maxSar).toBeGreaterThan(
      renData?.estimatedBudgetRangeSar?.minSar
    );
    expect(renData?.valueImprovementScenario?.estimatedPostRenovationValueUpliftSar).toBeGreaterThan(0);
  });

  it('7. Studio Integration Boundary Export', async () => {
    const proj = await createDesignProject({
      tenantId: tenantA,
      userId: user1,
      title: 'Dammam Seafront Villa',
      projectType: 'ARCHITECTURAL',
    });

    const exportResult = await exportDesignProjectToStudio(tenantA, proj.id);
    expect(exportResult.studioProjectId).toMatch(/^studio_proj_re_/);
    expect(exportResult.project.studioProjectId).toBe(exportResult.studioProjectId);
  });

  it('8. Investment Intelligence ROI Engine & Calculation Precision', () => {
    const metrics = calculateInvestmentMetrics({
      purchasePriceSar: 2000000,
      areaSqm: 400,
      estimatedAnnualRentSar: 160000,
      operatingExpensesAnnualSar: 20000,
      occupancyRatePct: 95,
      financingPercentagePct: 50,
      mortgageInterestRatePct: 5,
      loanTenureYears: 20,
    });

    // Price per sqm: 2,000,000 / 400 = 5000 SAR/sqm
    expect(metrics.pricePerSqmSar).toBe(5000);

    // Gross Yield: (160,000 / 2,000,000) * 100 = 8.00%
    expect(metrics.grossYieldPct).toBe(8.0);

    // Effective Gross Income: 160,000 * 0.95 = 152,000 SAR
    expect(metrics.effectiveGrossIncomeSar).toBe(152000);

    // Net Operating Income (NOI): 152,000 - 20,000 = 132,000 SAR
    expect(metrics.netOperatingIncomeSar).toBe(132000);

    // Net Cap Rate: (132,000 / 2,000,000) * 100 = 6.60%
    expect(metrics.netYieldPct).toBe(6.6);

    // Down Payment: 50% of 2M = 1,000,000 SAR
    expect(metrics.financingDetails.downPaymentSar).toBe(1000000);

    // 5-Year Forecast Array
    expect(metrics.fiveYearScenarioForecast.length).toBe(5);
    expect(metrics.fiveYearScenarioForecast[0].year).toBe(1);
    expect(metrics.fiveYearScenarioForecast[4].year).toBe(5);
  });

  it('9. Investment Analyses Store & Side-by-Side Comparison Matrix', async () => {
    const inv1 = await createInvestmentAnalysis({
      tenantId: tenantA,
      userId: user1,
      title: 'Riyadh High Yield Apartment',
      purchasePriceSar: 1000000,
      areaSqm: 120,
      estimatedAnnualRentSar: 95000,
      operatingExpensesAnnualSar: 5000,
      occupancyRatePct: 95,
      dataQualityStatus: 'ACTUAL',
    });

    const inv2 = await createInvestmentAnalysis({
      tenantId: tenantA,
      userId: user1,
      title: 'Jeddah Commercial Unit',
      purchasePriceSar: 2500000,
      areaSqm: 200,
      estimatedAnnualRentSar: 120000,
      operatingExpensesAnnualSar: 30000,
      occupancyRatePct: 90,
      dataQualityStatus: 'ESTIMATED',
    });

    const comparison = await compareInvestments(tenantA, [inv1.id, inv2.id]);
    expect(comparison.analyses.length).toBe(2);
    expect(comparison.comparisonMatrix.length).toBe(2);

    const match1 = comparison.comparisonMatrix.find((c) => c.analysisId === inv1.id);
    expect(match1?.grossYieldPct).toBe(9.5);
    expect(match1?.investmentRating).toBe('STRONG_BUY');
  });

  it('10. AI Investment Advisor Copilot Sensitivity Scenario', async () => {
    const inv = await createInvestmentAnalysis({
      tenantId: tenantA,
      userId: user1,
      title: 'Khobar Villa Compound',
      purchasePriceSar: 4000000,
      areaSqm: 500,
      estimatedAnnualRentSar: 320000,
      operatingExpensesAnnualSar: 20000,
    });

    const response = await askAiInvestmentAdvisor({
      tenantId: tenantA,
      userId: user1,
      prompt: 'What if rent drops by 10% on Khobar Villa Compound?',
      analysisIds: [inv.id],
    });

    expect(response.answer).toContain('Sensitivity Analysis');
    expect(response.sensitivityScenarios.length).toBe(3);
    expect(response.sensitivityScenarios.some((s) => s.scenario.includes('-10% Rent Drop'))).toBe(true);
  });
});
