import { describe, it, expect, beforeEach } from 'vitest';
import {
  createImmersiveAsset,
  listImmersiveAssets,
  getImmersiveAsset,
  deleteImmersiveAsset,
  createDigitalTwin,
  listDigitalTwins,
  getDigitalTwin,
  createDigitalTwinVersion,
  detectVRARCapability,
  logCapabilityCheck,
  handoffDesignToImmersive,
  getMarketplaceImmersiveAssets,
  auditProductBoundaryScope,
} from '../src/lib/realestate/realEstatePhase6Store';

describe('OPROX Real Estate — Phase 6 Immersive 3D, VR, AR & Digital Twin Suite', () => {
  const tenant1 = 'tenant_phase6_a';
  const tenant2 = 'tenant_phase6_b';
  const userId = 'usr_phase6_test';

  it('1. Immersive Asset Management — Create, List, IDOR Protection & Delete', async () => {
    // Tenant 1 creates asset
    const asset1 = await createImmersiveAsset({
      tenantId: tenant1,
      linkedEntityType: 'PROPERTY',
      linkedEntityId: 'prop_p6_001',
      assetType: 'GLB',
      title: 'Ground Floor 3D Building Model',
      storageReference: 'oprox://storage/models/building_ground.glb',
      fileSizeBytes: 15400000,
    });

    expect(asset1.id).toBeDefined();
    expect(asset1.assetType).toBe('GLB');
    expect(asset1.tenantId).toBe(tenant1);

    // List for Tenant 1
    const t1Assets = await listImmersiveAssets(tenant1, { linkedEntityId: 'prop_p6_001' });
    expect(t1Assets.length).toBeGreaterThanOrEqual(1);

    // Tenant 2 IDOR check - cannot view Tenant 1's asset
    const t2View = await getImmersiveAsset(tenant2, asset1.id);
    expect(t2View).toBeNull();

    // Tenant 1 retrieves asset
    const fetched = await getImmersiveAsset(tenant1, asset1.id);
    expect(fetched).not.toBeNull();

    // Tenant 2 cannot delete Tenant 1's asset
    const deleteByT2 = await deleteImmersiveAsset(tenant2, asset1.id);
    expect(deleteByT2).toBe(false);

    // Tenant 1 deletes asset
    const deleteByT1 = await deleteImmersiveAsset(tenant1, asset1.id);
    expect(deleteByT1).toBe(true);
  });

  it('2. Digital Twin Presentation Engine — Creation & Versioning', async () => {
    // Create v1 Digital Twin
    const twin1 = await createDigitalTwin({
      tenantId: tenant1,
      title: 'Digital Twin — Al-Riyadh Salmani Villa',
      linkedEntityType: 'PROPERTY',
      linkedEntityId: 'prop_twin_101',
      floorsCount: 2,
      spatialMetadataJson: {
        floors: [
          { floorNumber: 1, name: 'Ground Floor', roomsCount: 3 },
          { floorNumber: 2, name: 'First Floor', roomsCount: 4 },
        ],
        rooms: [
          { id: 'rm_101', name: 'Majlis', floorNumber: 1, areaSqm: 50, orientation: 'NORTH' },
          { id: 'rm_102', name: 'Courtyard Living', floorNumber: 1, areaSqm: 40, orientation: 'EAST' },
        ],
        dimensions: { totalAreaSqm: 420, maxElevationMeters: 8.5 },
      },
    });

    expect(twin1.id).toBeDefined();
    expect(twin1.versionNumber).toBe(1);
    expect(twin1.isCurrentVersion).toBe(true);

    // Create v2 Digital Twin
    const twin2 = await createDigitalTwinVersion(tenant1, twin1.id, {
      title: 'Digital Twin — Al-Riyadh Salmani Villa (v2 Structural Expansion)',
      floorsCount: 3,
      spatialMetadataJson: {
        floors: [
          { floorNumber: 1, name: 'Ground Floor', roomsCount: 3 },
          { floorNumber: 2, name: 'First Floor', roomsCount: 4 },
          { floorNumber: 3, name: 'Roof Terrace Suite', roomsCount: 2 },
        ],
        dimensions: { totalAreaSqm: 540, maxElevationMeters: 11.2 },
      },
    });

    expect(twin2.versionNumber).toBe(2);
    expect(twin2.isCurrentVersion).toBe(true);

    // Fetch current digital twins for Tenant 1
    const twins = await listDigitalTwins(tenant1, { linkedEntityId: 'prop_twin_101' });
    expect(twins[0].versionNumber).toBe(2);

    // Tenant 2 IDOR check
    const t2Twins = await listDigitalTwins(tenant2, { linkedEntityId: 'prop_twin_101' });
    expect(t2Twins.length).toBe(0);
  });

  it('3. WebXR VR / AR Capability Detection & Logging', async () => {
    // Test VR Detection
    const vrCheckQuest = await detectVRARCapability('VR', 'Mozilla/5.0 (OculusQuest2) OculusBrowser/24.0 WebXR');
    expect(vrCheckQuest).toBe('SUPPORTED');

    const vrCheckBot = await detectVRARCapability('VR', 'Googlebot/2.1');
    expect(vrCheckBot).toBe('UNSUPPORTED');

    // Test AR Detection
    const arCheckMobile = await detectVRARCapability('AR', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Chrome');
    expect(arCheckMobile).toBe('SUPPORTED');

    const arCheckDesktop = await detectVRARCapability('AR', 'Googlebot/2.1');
    expect(arCheckDesktop).toBe('UNSUPPORTED');

    // Test Logging
    const log = await logCapabilityCheck(tenant1, userId, 'VR', vrCheckQuest, 'OculusBrowser', 'prop_p6_001');
    expect(log.id).toBeDefined();
    expect(log.capabilityState).toBe('SUPPORTED');
  });

  it('4. Phase 5 Design -> Phase 6 Immersive Handoff (Reality Rules Check)', async () => {
    // Attempt handoff without 3D model converter configured -> Returns NOT_CONFIGURED
    const handoffNoModel = await handoffDesignToImmersive(tenant1, userId, 'proj_unconfigured', 'concept_unconfigured');
    expect(handoffNoModel.status).toBe('NOT_CONFIGURED');
    expect(handoffNoModel.message).toContain('No production BIM');

    // Register a READY 3D model asset
    await createImmersiveAsset({
      tenantId: tenant1,
      linkedEntityType: 'DESIGN_PROJECT',
      linkedEntityId: 'proj_configured',
      assetType: 'GLB',
      title: 'Architectural Concept 3D Model',
      storageReference: 'oprox://storage/models/concept_model.glb',
      processingState: 'READY',
    });

    const handoffWithModel = await handoffDesignToImmersive(tenant1, userId, 'proj_configured', 'concept_configured');
    expect(handoffWithModel.status).toBe('READY');
    expect(handoffWithModel.digitalTwin).toBeDefined();
  });

  it('5. Marketplace & Developer Project Immersive Integration', async () => {
    // Add 3D GLB & 360 Panorama to a listing
    await createImmersiveAsset({
      tenantId: tenant1,
      linkedEntityType: 'LISTING',
      linkedEntityId: 'lst_p6_99',
      assetType: 'GLB',
      title: 'Unit 3D Layout',
      storageReference: 'oprox://storage/models/unit_3d.glb',
    });

    await createImmersiveAsset({
      tenantId: tenant1,
      linkedEntityType: 'LISTING',
      linkedEntityId: 'lst_p6_99',
      assetType: 'PANORAMA_360',
      title: 'Living Room 360 View',
      storageReference: 'oprox://storage/panoramas/living_360.jpg',
    });

    const marketplaceAssets = await getMarketplaceImmersiveAssets(tenant1, 'LISTING', 'lst_p6_99');
    expect(marketplaceAssets.has3d).toBe(true);
    expect(marketplaceAssets.has360).toBe(true);
    expect(marketplaceAssets.models.glb).not.toBeNull();
    expect(marketplaceAssets.models.panorama360).not.toBeNull();
  });

  it('6. Product Boundary & Scope Audit — Zero Facility Management Bleed', () => {
    const audit = auditProductBoundaryScope();
    expect(audit.FACILITY_MANAGEMENT_FEATURES).toBe(0);
    expect(audit.CMMS_FEATURES).toBe(0);
    expect(audit.WORK_ORDER_FEATURES).toBe(0);
    expect(audit.SPARE_PARTS_FEATURES).toBe(0);
    expect(audit.TECHNICIAN_DISPATCH_FEATURES).toBe(0);
    expect(audit.status).toBe('PASS');
  });
});
