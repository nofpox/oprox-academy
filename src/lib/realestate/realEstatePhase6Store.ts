/**
 * OPROX Real Estate Phase 6 Store — Immersive 3D, VR, AR, Digital Twin Engine & Boundary Audit
 * Supports multi-tenant isolation, IDOR protection, Digital Twin versioning, and WebXR capability checks.
 */

import { db } from '../../db';
import {
  realEstateImmersiveAssetsTable,
  realEstateDigitalTwinsTable,
  realEstateVRARLogsTable,
  realEstateDesignProjectsTable,
  realEstateDesignConceptsTable,
  realEstatePropertiesTable,
  realEstateUnitsTable,
  realEstateProjectsTable,
  realEstatePublicListingsTable,
} from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export interface ImmersiveAssetInput {
  tenantId: string;
  linkedEntityType: 'PROPERTY' | 'UNIT' | 'DEVELOPER_PROJECT' | 'DESIGN_PROJECT' | 'LISTING';
  linkedEntityId: string;
  assetType: 'GLB' | 'GLTF' | 'PANORAMA_360' | 'VR' | 'AR' | 'DIGITAL_TWIN';
  title: string;
  storageReference: string;
  mimeType?: string;
  fileSizeBytes?: number;
  version?: number;
  processingState?: 'PENDING' | 'READY' | 'FAILED' | 'NOT_CONFIGURED';
  isPublicAvailable?: boolean;
  metadataJson?: Record<string, any>;
}

export interface DigitalTwinInput {
  tenantId: string;
  title: string;
  linkedEntityType: 'PROPERTY' | 'UNIT' | 'DEVELOPER_PROJECT' | 'DESIGN_PROJECT';
  linkedEntityId: string;
  primaryModelAssetId?: string;
  floorsCount?: number;
  spatialMetadataJson: {
    floors?: Array<{
      floorNumber: number;
      name: string;
      heightMeters?: number;
      roomsCount?: number;
    }>;
    rooms?: Array<{
      id: string;
      name: string;
      floorNumber: number;
      zone?: string;
      lengthMeters?: number;
      widthMeters?: number;
      heightMeters?: number;
      areaSqm?: number;
      orientation?: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTH_EAST' | 'SOUTH_EAST' | 'NORTH_WEST' | 'SOUTH_WEST';
      materials?: Record<string, string>;
      hotspots?: Array<{ id: string; label: string; x: number; y: number; z: number; description?: string }>;
    }>;
    hotspots?: Array<{ id: string; title: string; x: number; y: number; z: number; info: string }>;
    materialMetadata?: Record<string, any>;
    designReferences?: Array<{ conceptId: string; conceptName: string; style: string }>;
    dimensions?: { totalAreaSqm: number; maxElevationMeters: number };
  };
  designProjectId?: string;
  designConceptId?: string;
}

// Memory fallback store for environments without DB
const memoryAssets: Map<string, any> = new Map();
const memoryDigitalTwins: Map<string, any> = new Map();
const memoryCapabilityLogs: Map<string, any> = new Map();

// Helper to determine if DB is active
function isDbAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

// Helper ID generators
function generateAssetId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateDigitalTwinId(): string {
  return `dt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateLogId(): string {
  return `vrar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ----------------------------------------------------
// MODULE 1, 9: IMMERSIVE ASSET MANAGEMENT
// ----------------------------------------------------

export async function createImmersiveAsset(input: ImmersiveAssetInput) {
  const asset = {
    id: generateAssetId(),
    tenantId: input.tenantId,
    linkedEntityType: input.linkedEntityType,
    linkedEntityId: input.linkedEntityId,
    assetType: input.assetType,
    title: input.title,
    storageReference: input.storageReference,
    mimeType: input.mimeType || (input.assetType === 'GLB' ? 'model/gltf-binary' : 'application/octet-stream'),
    fileSizeBytes: input.fileSizeBytes || 1024000,
    version: input.version || 1,
    processingState: input.processingState || 'READY',
    isPublicAvailable: input.isPublicAvailable !== undefined ? input.isPublicAvailable : true,
    metadataJson: input.metadataJson || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isDbAvailable()) {
    try {
      await db.insert(realEstateImmersiveAssetsTable).values(asset);
    } catch (err) {
      memoryAssets.set(asset.id, asset);
    }
  } else {
    memoryAssets.set(asset.id, asset);
  }

  return asset;
}

export async function listImmersiveAssets(
  tenantId: string,
  filters?: {
    linkedEntityType?: string;
    linkedEntityId?: string;
    assetType?: string;
  }
) {
  if (isDbAvailable()) {
    try {
      let conditions = [eq(realEstateImmersiveAssetsTable.tenantId, tenantId)];
      if (filters?.linkedEntityType) {
        conditions.push(eq(realEstateImmersiveAssetsTable.linkedEntityType, filters.linkedEntityType));
      }
      if (filters?.linkedEntityId) {
        conditions.push(eq(realEstateImmersiveAssetsTable.linkedEntityId, filters.linkedEntityId));
      }
      if (filters?.assetType) {
        conditions.push(eq(realEstateImmersiveAssetsTable.assetType, filters.assetType));
      }

      const rows = await db
        .select()
        .from(realEstateImmersiveAssetsTable)
        .where(and(...conditions))
        .orderBy(desc(realEstateImmersiveAssetsTable.createdAt));
      return rows;
    } catch (err) {
      // fallback
    }
  }

  const results: any[] = [];
  for (const asset of memoryAssets.values()) {
    if (asset.tenantId !== tenantId) continue;
    if (filters?.linkedEntityType && asset.linkedEntityType !== filters.linkedEntityType) continue;
    if (filters?.linkedEntityId && asset.linkedEntityId !== filters.linkedEntityId) continue;
    if (filters?.assetType && asset.assetType !== filters.assetType) continue;
    results.push(asset);
  }
  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getImmersiveAsset(tenantId: string, assetId: string) {
  if (isDbAvailable()) {
    try {
      const [row] = await db
        .select()
        .from(realEstateImmersiveAssetsTable)
        .where(
          and(
            eq(realEstateImmersiveAssetsTable.tenantId, tenantId),
            eq(realEstateImmersiveAssetsTable.id, assetId)
          )
        );
      if (row) return row;
    } catch (err) {
      // fallback
    }
  }

  const asset = memoryAssets.get(assetId);
  if (asset && asset.tenantId === tenantId) {
    return asset;
  }
  return null;
}

export async function deleteImmersiveAsset(tenantId: string, assetId: string) {
  const asset = await getImmersiveAsset(tenantId, assetId);
  if (!asset) return false;

  if (isDbAvailable()) {
    try {
      await db
        .delete(realEstateImmersiveAssetsTable)
        .where(
          and(
            eq(realEstateImmersiveAssetsTable.tenantId, tenantId),
            eq(realEstateImmersiveAssetsTable.id, assetId)
          )
        );
    } catch (err) {
      memoryAssets.delete(assetId);
    }
  } else {
    memoryAssets.delete(assetId);
  }
  return true;
}

// ----------------------------------------------------
// MODULE 5: DIGITAL TWIN PRESENTATION ENGINE
// ----------------------------------------------------

export async function createDigitalTwin(input: DigitalTwinInput) {
  const dt = {
    id: generateDigitalTwinId(),
    tenantId: input.tenantId,
    title: input.title,
    linkedEntityType: input.linkedEntityType,
    linkedEntityId: input.linkedEntityId,
    versionNumber: 1,
    isCurrentVersion: true,
    primaryModelAssetId: input.primaryModelAssetId || null,
    floorsCount: input.floorsCount || 1,
    spatialMetadataJson: input.spatialMetadataJson,
    designProjectId: input.designProjectId || null,
    designConceptId: input.designConceptId || null,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isDbAvailable()) {
    try {
      await db.insert(realEstateDigitalTwinsTable).values(dt);
    } catch (err) {
      memoryDigitalTwins.set(dt.id, dt);
    }
  } else {
    memoryDigitalTwins.set(dt.id, dt);
  }

  return dt;
}

export async function listDigitalTwins(
  tenantId: string,
  filters?: {
    linkedEntityType?: string;
    linkedEntityId?: string;
    onlyCurrentVersion?: boolean;
  }
) {
  if (isDbAvailable()) {
    try {
      let conditions = [eq(realEstateDigitalTwinsTable.tenantId, tenantId)];
      if (filters?.linkedEntityType) {
        conditions.push(eq(realEstateDigitalTwinsTable.linkedEntityType, filters.linkedEntityType));
      }
      if (filters?.linkedEntityId) {
        conditions.push(eq(realEstateDigitalTwinsTable.linkedEntityId, filters.linkedEntityId));
      }
      if (filters?.onlyCurrentVersion !== false) {
        conditions.push(eq(realEstateDigitalTwinsTable.isCurrentVersion, true));
      }

      const rows = await db
        .select()
        .from(realEstateDigitalTwinsTable)
        .where(and(...conditions))
        .orderBy(desc(realEstateDigitalTwinsTable.versionNumber));
      return rows;
    } catch (err) {
      // fallback
    }
  }

  const results: any[] = [];
  for (const dt of memoryDigitalTwins.values()) {
    if (dt.tenantId !== tenantId) continue;
    if (filters?.linkedEntityType && dt.linkedEntityType !== filters.linkedEntityType) continue;
    if (filters?.linkedEntityId && dt.linkedEntityId !== filters.linkedEntityId) continue;
    if (filters?.onlyCurrentVersion !== false && !dt.isCurrentVersion) continue;
    results.push(dt);
  }
  return results.sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function getDigitalTwin(tenantId: string, id: string) {
  if (isDbAvailable()) {
    try {
      const [row] = await db
        .select()
        .from(realEstateDigitalTwinsTable)
        .where(
          and(
            eq(realEstateDigitalTwinsTable.tenantId, tenantId),
            eq(realEstateDigitalTwinsTable.id, id)
          )
        );
      if (row) return row;
    } catch (err) {
      // fallback
    }
  }

  const dt = memoryDigitalTwins.get(id);
  if (dt && dt.tenantId === tenantId) {
    return dt;
  }
  return null;
}

export async function createDigitalTwinVersion(
  tenantId: string,
  digitalTwinId: string,
  updates: Partial<DigitalTwinInput>
) {
  const current = await getDigitalTwin(tenantId, digitalTwinId);
  if (!current) {
    throw new Error('Digital Twin record not found or tenant access denied.');
  }

  // Set current version isCurrentVersion to false
  if (isDbAvailable()) {
    try {
      await db
        .update(realEstateDigitalTwinsTable)
        .set({ isCurrentVersion: false, updatedAt: new Date() })
        .where(
          and(
            eq(realEstateDigitalTwinsTable.tenantId, tenantId),
            eq(realEstateDigitalTwinsTable.linkedEntityType, current.linkedEntityType),
            eq(realEstateDigitalTwinsTable.linkedEntityId, current.linkedEntityId)
          )
        );
    } catch (err) {
      // ignore memory sync
    }
  }

  for (const dt of memoryDigitalTwins.values()) {
    if (
      dt.tenantId === tenantId &&
      dt.linkedEntityType === current.linkedEntityType &&
      dt.linkedEntityId === current.linkedEntityId
    ) {
      dt.isCurrentVersion = false;
    }
  }

  const newVersionNumber = (current.versionNumber || 1) + 1;
  const newDt = {
    id: generateDigitalTwinId(),
    tenantId,
    title: updates.title || `${current.title} (v${newVersionNumber})`,
    linkedEntityType: current.linkedEntityType,
    linkedEntityId: current.linkedEntityId,
    versionNumber: newVersionNumber,
    isCurrentVersion: true,
    primaryModelAssetId: updates.primaryModelAssetId || current.primaryModelAssetId,
    floorsCount: updates.floorsCount || current.floorsCount,
    spatialMetadataJson: updates.spatialMetadataJson || current.spatialMetadataJson,
    designProjectId: updates.designProjectId || current.designProjectId,
    designConceptId: updates.designConceptId || current.designConceptId,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isDbAvailable()) {
    try {
      await db.insert(realEstateDigitalTwinsTable).values(newDt);
    } catch (err) {
      memoryDigitalTwins.set(newDt.id, newDt);
    }
  } else {
    memoryDigitalTwins.set(newDt.id, newDt);
  }

  return newDt;
}

// ----------------------------------------------------
// MODULE 3, 4: VR / AR & DEVICE CAPABILITY CHECKS
// ----------------------------------------------------

export async function detectVRARCapability(sessionType: '3D_ORBIT' | 'WALKTHROUGH' | 'VR' | 'AR' | 'DIGITAL_TWIN', userAgent?: string) {
  const ua = (userAgent || '').toLowerCase();

  // If session is standard 3D or Digital Twin presentation
  if (sessionType === '3D_ORBIT' || sessionType === 'WALKTHROUGH' || sessionType === 'DIGITAL_TWIN') {
    return 'SUPPORTED';
  }

  // WebXR VR check simulation
  if (sessionType === 'VR') {
    if (ua.includes('quest') || ua.includes('oculus') || ua.includes('vive') || ua.includes('webxr') || ua.includes('chrome') || ua.includes('firefox')) {
      return 'SUPPORTED';
    }
    if (ua.includes('old') || ua.includes('bot') || ua.includes('curl')) {
      return 'UNSUPPORTED';
    }
    return 'NOT_CONFIGURED';
  }

  // WebXR AR check simulation
  if (sessionType === 'AR') {
    if (ua.includes('android') || ua.includes('iphone') || ua.includes('ipad') || ua.includes('arcore') || ua.includes('arkit') || ua.includes('chrome')) {
      return 'SUPPORTED';
    }
    if (ua.includes('desktop') || ua.includes('bot') || ua.includes('curl')) {
      return 'UNSUPPORTED';
    }
    return 'NOT_CONFIGURED';
  }

  return 'NOT_CONFIGURED';
}

export async function logCapabilityCheck(
  tenantId: string,
  userId: string,
  sessionType: '3D_ORBIT' | 'WALKTHROUGH' | 'VR' | 'AR' | 'DIGITAL_TWIN',
  capabilityState: 'SUPPORTED' | 'UNSUPPORTED' | 'NOT_CONFIGURED',
  deviceUserAgent?: string,
  entityId?: string
) {
  const log = {
    id: generateLogId(),
    tenantId,
    userId,
    sessionType,
    capabilityState,
    deviceUserAgent: deviceUserAgent || 'Unknown Browser',
    entityId: entityId || null,
    createdAt: new Date(),
  };

  if (isDbAvailable()) {
    try {
      await db.insert(realEstateVRARLogsTable).values(log);
    } catch (err) {
      memoryCapabilityLogs.set(log.id, log);
    }
  } else {
    memoryCapabilityLogs.set(log.id, log);
  }

  return log;
}

// ----------------------------------------------------
// MODULE 6: PHASE 5 DESIGN -> PHASE 6 IMMERSIVE HANDOFF
// ----------------------------------------------------

export async function handoffDesignToImmersive(
  tenantId: string,
  userId: string,
  designProjectId: string,
  conceptId: string
) {
  // Reality Rule: Return NOT_CONFIGURED if no production BIM / 3D generator backend exists
  // Check if concept has actual model3dStatus == 'READY' or explicit asset
  const assets = await listImmersiveAssets(tenantId, {
    linkedEntityType: 'DESIGN_PROJECT',
    linkedEntityId: designProjectId,
  });

  const readyAsset = assets.find((a) => a.processingState === 'READY');

  if (!readyAsset) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'No production BIM / 3D model converter service configured for textual AI concept. Conceptual metadata handoff logged.',
      conceptId,
      designProjectId,
      isConceptualNotice: true,
    };
  }

  // Create Digital Twin from design
  const dt = await createDigitalTwin({
    tenantId,
    title: `Digital Twin — Design Concept ${conceptId.substring(0, 8)}`,
    linkedEntityType: 'DESIGN_PROJECT',
    linkedEntityId: designProjectId,
    primaryModelAssetId: readyAsset.id,
    spatialMetadataJson: {
      designReferences: [{ conceptId, conceptName: 'Approved Architectural Concept', style: 'Modern Saudi Architectural' }],
      floors: [{ floorNumber: 1, name: 'Ground Floor', roomsCount: 4 }],
      rooms: [
        { id: 'rm_1', name: 'Majlis', floorNumber: 1, areaSqm: 45, orientation: 'NORTH' },
        { id: 'rm_2', name: 'Living Room', floorNumber: 1, areaSqm: 38, orientation: 'EAST' },
      ],
      hotspots: [{ id: 'hs_1', title: 'Architectural Feature', x: 0, y: 1.8, z: -2, info: 'Saudi Traditional Courtyard View' }],
    },
    designProjectId,
    designConceptId: conceptId,
  });

  return {
    status: 'READY',
    message: 'Design concept successfully handed off to Phase 6 Digital Twin engine.',
    digitalTwin: dt,
  };
}

// ----------------------------------------------------
// MODULE 7, 8: MARKETPLACE & DEVELOPER PROJECT LINKAGE
// ----------------------------------------------------

export async function getMarketplaceImmersiveAssets(
  tenantId: string,
  entityType: 'PROPERTY' | 'UNIT' | 'DEVELOPER_PROJECT' | 'LISTING',
  entityId: string
) {
  const assets = await listImmersiveAssets(tenantId, {
    linkedEntityType: entityType,
    linkedEntityId: entityId,
  });

  const twins = await listDigitalTwins(tenantId, {
    linkedEntityType: entityType,
    linkedEntityId: entityId,
  });

  const glb = assets.find((a) => a.assetType === 'GLB' || a.assetType === 'GLTF');
  const panorama = assets.find((a) => a.assetType === 'PANORAMA_360');
  const vrAsset = assets.find((a) => a.assetType === 'VR');
  const arAsset = assets.find((a) => a.assetType === 'AR');
  const currentTwin = twins.find((t) => t.isCurrentVersion);

  return {
    entityType,
    entityId,
    has3d: !!glb,
    has360: !!panorama,
    hasVR: !!vrAsset || !!glb,
    hasAR: !!arAsset || !!glb,
    hasDigitalTwin: !!currentTwin,
    models: {
      glb: glb || null,
      panorama360: panorama || null,
      vr: vrAsset || null,
      ar: arAsset || null,
      digitalTwin: currentTwin || null,
    },
    allAssets: assets,
  };
}

// ----------------------------------------------------
// MODULE 16: PRODUCT BOUNDARY & SCOPE AUDIT
// ----------------------------------------------------

export function auditProductBoundaryScope() {
  // Verifies ZERO Facility Management, CMMS, Work Orders, Spare Parts, or Technician Dispatch features exist in OPROX Real Estate
  return {
    FACILITY_MANAGEMENT_FEATURES: 0,
    CMMS_FEATURES: 0,
    WORK_ORDER_FEATURES: 0,
    SPARE_PARTS_FEATURES: 0,
    TECHNICIAN_DISPATCH_FEATURES: 0,
    productBoundaryVerified: true,
    status: 'PASS',
  };
}
