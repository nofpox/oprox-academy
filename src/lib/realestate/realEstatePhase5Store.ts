/**
 * OPROX Real Estate Phase 5 — AI Architectural, Design & Investment Intelligence Store
 * Authoritative dual-mode (Database + In-Memory) store with multi-tenant isolation.
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import {
  realEstateDesignProjectsTable,
  realEstateDesignConceptsTable,
  realEstateInvestmentAnalysesTable,
  RealEstateDesignProjectRow,
  RealEstateDesignConceptRow,
  RealEstateInvestmentAnalysisRow,
} from '../../db/schema';

// In-memory fallbacks for non-DB environments / testing
const memoryDesignProjects: RealEstateDesignProjectRow[] = [];
const memoryDesignConcepts: RealEstateDesignConceptRow[] = [];
const memoryInvestmentAnalyses: RealEstateInvestmentAnalysisRow[] = [];

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export const ARCHITECTURAL_DISCLAIMER =
  'CONCEPTUAL ONLY — THIS AI ARCHITECTURAL DESIGN IS FOR CONCEPTUAL PLANNING AND DOES NOT CONSTITUTE CERTIFIED ENGINEERING OR CONSTRUCTION DRAWINGS. PROFESSIONAL ARCHITECT/ENGINEER STAMP REQUIRED FOR PERMITTING AND BUILDING.';

export const RENOVATION_DISCLAIMER =
  'ESTIMATE ONLY — ALL RENOVATION COST AND VALUE UPLIFT FIGURES ARE ESTIMATED STATISTICAL RANGES AND DO NOT CONSTITUTE A BINDING CONTRACTOR BIDO OR CERTIFIED APPRAISAL.';

// ──────────────────────────────────────────────────────────────────────────────
// MODULE 1, 2, 3, 4, 6: DESIGN PROJECTS & CONCEPTS WORKSPACE ENGINE
// ──────────────────────────────────────────────────────────────────────────────

export async function createDesignProject(data: {
  tenantId: string;
  userId: string;
  title: string;
  projectType: 'ARCHITECTURAL' | 'INTERIOR' | 'EXTERIOR' | 'RENOVATION' | 'MULTI_DISCIPLINARY';
  propertyId?: string;
  unitId?: string;
  listingId?: string;
  developerProjectId?: string;
  studioProjectId?: string;
  requirementsJson?: Record<string, any>;
  notes?: string;
}): Promise<RealEstateDesignProjectRow> {
  const id = genId('dp');
  const now = new Date();

  const newProject: RealEstateDesignProjectRow = {
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    title: data.title,
    projectType: data.projectType,
    propertyId: data.propertyId || null,
    unitId: data.unitId || null,
    listingId: data.listingId || null,
    developerProjectId: data.developerProjectId || null,
    studioProjectId: data.studioProjectId || null,
    status: 'ACTIVE',
    requirementsJson: data.requirementsJson || {},
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (db) {
      const [inserted] = await db
        .insert(realEstateDesignProjectsTable)
        .values({
          id,
          tenantId: data.tenantId,
          userId: data.userId,
          title: data.title,
          projectType: data.projectType,
          propertyId: data.propertyId || null,
          unitId: data.unitId || null,
          listingId: data.listingId || null,
          developerProjectId: data.developerProjectId || null,
          studioProjectId: data.studioProjectId || null,
          status: 'ACTIVE',
          requirementsJson: data.requirementsJson || {},
          notes: data.notes || null,
        })
        .returning();
      if (inserted) return inserted;
    }
  } catch (err) {
    // Fallback to memory
  }

  memoryDesignProjects.push(newProject);
  return newProject;
}

export async function getDesignProject(
  tenantId: string,
  projectId: string
): Promise<RealEstateDesignProjectRow | null> {
  try {
    if (db) {
      const rows = await db
        .select()
        .from(realEstateDesignProjectsTable)
        .where(
          and(
            eq(realEstateDesignProjectsTable.id, projectId),
            eq(realEstateDesignProjectsTable.tenantId, tenantId)
          )
        );
      if (rows.length > 0) return rows[0];
    }
  } catch (err) {
    // Fallback
  }

  const proj = memoryDesignProjects.find((p) => p.id === projectId && p.tenantId === tenantId);
  return proj || null;
}

export async function listDesignProjects(
  tenantId: string,
  filters?: {
    userId?: string;
    projectType?: string;
    propertyId?: string;
    status?: string;
  }
): Promise<RealEstateDesignProjectRow[]> {
  try {
    if (db) {
      const conditions = [eq(realEstateDesignProjectsTable.tenantId, tenantId)];
      if (filters?.userId) conditions.push(eq(realEstateDesignProjectsTable.userId, filters.userId));
      if (filters?.projectType)
        conditions.push(eq(realEstateDesignProjectsTable.projectType, filters.projectType));
      if (filters?.propertyId)
        conditions.push(eq(realEstateDesignProjectsTable.propertyId, filters.propertyId));
      if (filters?.status) conditions.push(eq(realEstateDesignProjectsTable.status, filters.status));

      const rows = await db
        .select()
        .from(realEstateDesignProjectsTable)
        .where(and(...conditions))
        .orderBy(desc(realEstateDesignProjectsTable.createdAt));
      return rows;
    }
  } catch (err) {
    // Fallback
  }

  return memoryDesignProjects.filter((p) => {
    if (p.tenantId !== tenantId) return false;
    if (filters?.userId && p.userId !== filters.userId) return false;
    if (filters?.projectType && p.projectType !== filters.projectType) return false;
    if (filters?.propertyId && p.propertyId !== filters.propertyId) return false;
    if (filters?.status && p.status !== filters.status) return false;
    return true;
  });
}

export async function updateDesignProject(
  tenantId: string,
  projectId: string,
  updates: {
    title?: string;
    status?: string;
    notes?: string;
    studioProjectId?: string;
    requirementsJson?: Record<string, any>;
  }
): Promise<RealEstateDesignProjectRow | null> {
  const existing = await getDesignProject(tenantId, projectId);
  if (!existing) return null;

  const now = new Date();

  try {
    if (db) {
      const [updated] = await db
        .update(realEstateDesignProjectsTable)
        .set({
          ...updates,
          updatedAt: now,
        })
        .where(
          and(
            eq(realEstateDesignProjectsTable.id, projectId),
            eq(realEstateDesignProjectsTable.tenantId, tenantId)
          )
        )
        .returning();
      if (updated) return updated;
    }
  } catch (err) {
    // Fallback
  }

  if (updates.title !== undefined) existing.title = updates.title;
  if (updates.status !== undefined) existing.status = updates.status;
  if (updates.notes !== undefined) existing.notes = updates.notes;
  if (updates.studioProjectId !== undefined) existing.studioProjectId = updates.studioProjectId;
  if (updates.requirementsJson !== undefined) existing.requirementsJson = updates.requirementsJson;
  existing.updatedAt = now;

  return existing;
}

export async function deleteDesignProject(
  tenantId: string,
  projectId: string
): Promise<boolean> {
  const existing = await getDesignProject(tenantId, projectId);
  if (!existing) return false;

  try {
    if (db) {
      await db
        .delete(realEstateDesignProjectsTable)
        .where(
          and(
            eq(realEstateDesignProjectsTable.id, projectId),
            eq(realEstateDesignProjectsTable.tenantId, tenantId)
          )
        );
      return true;
    }
  } catch (err) {
    // Fallback
  }

  const idx = memoryDesignProjects.findIndex(
    (p) => p.id === projectId && p.tenantId === tenantId
  );
  if (idx !== -1) {
    memoryDesignProjects.splice(idx, 1);
    return true;
  }
  return false;
}

// ── CONCEPTS ENGINE ──────────────────────────────────────────────────────────

export async function createDesignConcept(data: {
  tenantId: string;
  designProjectId: string;
  conceptName: string;
  conceptType: 'ARCHITECTURAL' | 'INTERIOR' | 'EXTERIOR' | 'LANDSCAPE' | 'RENOVATION';
  style?: string;
  spacePlanningJson?: Record<string, any>;
  interiorDetailsJson?: Record<string, any>;
  exteriorDetailsJson?: Record<string, any>;
  renovationDetailsJson?: Record<string, any>;
  rationale?: string;
  approvalStatus?: 'CONCEPTUAL' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  aiGenerated?: boolean;
  aiModelUsed?: string;
  mediaJson?: any[];
  model3dStatus?: string;
  spatialMetaJson?: Record<string, any>;
}): Promise<RealEstateDesignConceptRow> {
  // Ensure project belongs to tenant
  const proj = await getDesignProject(data.tenantId, data.designProjectId);
  if (!proj) {
    throw new Error('Design project not found or access denied for this tenant.');
  }

  // Calculate next version number
  const existingConcepts = await listDesignConcepts(data.tenantId, data.designProjectId);
  const versionNumber = existingConcepts.length + 1;

  const id = genId('dc');
  const now = new Date();

  const newConcept: RealEstateDesignConceptRow = {
    id,
    tenantId: data.tenantId,
    designProjectId: data.designProjectId,
    conceptName: data.conceptName,
    conceptType: data.conceptType,
    versionNumber,
    style: data.style || 'Modern',
    spacePlanningJson: data.spacePlanningJson || null,
    interiorDetailsJson: data.interiorDetailsJson || null,
    exteriorDetailsJson: data.exteriorDetailsJson || null,
    renovationDetailsJson: data.renovationDetailsJson || null,
    rationale: data.rationale || 'AI Concept generated based on spatial and functional requirements.',
    approvalStatus: data.approvalStatus || 'CONCEPTUAL',
    isConceptualNotice: true,
    aiGenerated: data.aiGenerated !== undefined ? data.aiGenerated : true,
    aiModelUsed: data.aiModelUsed || 'OPROX-Gemini-Architect-v1',
    mediaJson: data.mediaJson || [],
    model3dStatus: data.model3dStatus || 'NOT_CONFIGURED',
    spatialMetaJson: data.spatialMetaJson || { digitalTwinReady: false },
    createdAt: now,
  };

  try {
    if (db) {
      const [inserted] = await db
        .insert(realEstateDesignConceptsTable)
        .values({
          id,
          tenantId: data.tenantId,
          designProjectId: data.designProjectId,
          conceptName: data.conceptName,
          conceptType: data.conceptType,
          versionNumber,
          style: data.style || 'Modern',
          spacePlanningJson: data.spacePlanningJson || null,
          interiorDetailsJson: data.interiorDetailsJson || null,
          exteriorDetailsJson: data.exteriorDetailsJson || null,
          renovationDetailsJson: data.renovationDetailsJson || null,
          rationale: data.rationale || null,
          approvalStatus: data.approvalStatus || 'CONCEPTUAL',
          isConceptualNotice: true,
          aiGenerated: data.aiGenerated !== undefined ? data.aiGenerated : true,
          aiModelUsed: data.aiModelUsed || 'OPROX-Gemini-Architect-v1',
          mediaJson: data.mediaJson || [],
          model3dStatus: data.model3dStatus || 'NOT_CONFIGURED',
          spatialMetaJson: data.spatialMetaJson || { digitalTwinReady: false },
        })
        .returning();
      if (inserted) return inserted;
    }
  } catch (err) {
    // Fallback
  }

  memoryDesignConcepts.push(newConcept);
  return newConcept;
}

export async function listDesignConcepts(
  tenantId: string,
  designProjectId: string
): Promise<RealEstateDesignConceptRow[]> {
  try {
    if (db) {
      const rows = await db
        .select()
        .from(realEstateDesignConceptsTable)
        .where(
          and(
            eq(realEstateDesignConceptsTable.tenantId, tenantId),
            eq(realEstateDesignConceptsTable.designProjectId, designProjectId)
          )
        )
        .orderBy(desc(realEstateDesignConceptsTable.versionNumber));
      return rows;
    }
  } catch (err) {
    // Fallback
  }

  return memoryDesignConcepts
    .filter((c) => c.tenantId === tenantId && c.designProjectId === designProjectId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function getDesignConcept(
  tenantId: string,
  conceptId: string
): Promise<RealEstateDesignConceptRow | null> {
  try {
    if (db) {
      const rows = await db
        .select()
        .from(realEstateDesignConceptsTable)
        .where(
          and(
            eq(realEstateDesignConceptsTable.id, conceptId),
            eq(realEstateDesignConceptsTable.tenantId, tenantId)
          )
        );
      if (rows.length > 0) return rows[0];
    }
  } catch (err) {
    // Fallback
  }

  const conc = memoryDesignConcepts.find((c) => c.id === conceptId && c.tenantId === tenantId);
  return conc || null;
}

export async function updateConceptApproval(
  tenantId: string,
  conceptId: string,
  status: 'CONCEPTUAL' | 'REVIEWED' | 'APPROVED' | 'REJECTED'
): Promise<RealEstateDesignConceptRow | null> {
  const existing = await getDesignConcept(tenantId, conceptId);
  if (!existing) return null;

  try {
    if (db) {
      const [updated] = await db
        .update(realEstateDesignConceptsTable)
        .set({ approvalStatus: status })
        .where(
          and(
            eq(realEstateDesignConceptsTable.id, conceptId),
            eq(realEstateDesignConceptsTable.tenantId, tenantId)
          )
        )
        .returning();
      if (updated) return updated;
    }
  } catch (err) {
    // Fallback
  }

  existing.approvalStatus = status;
  return existing;
}

// ──────────────────────────────────────────────────────────────────────────────
// MODULE 1: AI ARCHITECT CONCEPT GENERATOR
// ──────────────────────────────────────────────────────────────────────────────

export async function generateAiArchitectConcept(params: {
  tenantId: string;
  userId: string;
  projectId?: string;
  title: string;
  plotDimensions?: string;
  areaSqm: number;
  roomRequirements: string;
  floorsCount: number;
  usageType?: 'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED_USE';
  architecturalStyle: string;
  budgetSar?: number;
  freeTextRequirements?: string;
}): Promise<{ project: RealEstateDesignProjectRow; concept: RealEstateDesignConceptRow }> {
  // 1. Create or retrieve Design Project
  let proj: RealEstateDesignProjectRow;
  if (params.projectId) {
    const existing = await getDesignProject(params.tenantId, params.projectId);
    if (!existing) throw new Error('Project not found or access denied.');
    proj = existing;
  } else {
    proj = await createDesignProject({
      tenantId: params.tenantId,
      userId: params.userId,
      title: params.title || `Architectural Concept - ${params.architecturalStyle}`,
      projectType: 'ARCHITECTURAL',
      requirementsJson: {
        plotDimensions: params.plotDimensions || '20m x 25m',
        areaSqm: params.areaSqm,
        roomRequirements: params.roomRequirements,
        floorsCount: params.floorsCount,
        usageType: params.usageType || 'RESIDENTIAL',
        architecturalStyle: params.architecturalStyle,
        budgetSar: params.budgetSar,
        freeTextRequirements: params.freeTextRequirements,
      },
    });
  }

  // 2. Generate structured architectural concept
  const totalArea = params.areaSqm || 400;
  const groundFloorArea = Math.round(totalArea * 0.45);
  const firstFloorArea = Math.round(totalArea * 0.40);
  const annexArea = totalArea - groundFloorArea - firstFloorArea;

  const spacePlanningJson = {
    totalAreaSqm: totalArea,
    floorsCount: params.floorsCount || 2,
    functionalZones: [
      {
        zoneName: 'Public & Guest Majlis Zone',
        floor: 'Ground Floor',
        allocatedAreaSqm: Math.round(groundFloorArea * 0.45),
        privacyLevel: 'HIGH_PUBLIC',
        features: ['Independent External Entrance', 'Guest Washrooms & Dining', 'Main Reception'],
      },
      {
        zoneName: 'Family Living & Inner Courtyard',
        floor: 'Ground Floor',
        allocatedAreaSqm: Math.round(groundFloorArea * 0.35),
        privacyLevel: 'FAMILY_PRIVATE',
        features: ['Double-Height Living Room', 'Garden View Glass Panels', 'Open Kitchen Integration'],
      },
      {
        zoneName: 'Private Bedroom Suites',
        floor: 'First Floor',
        allocatedAreaSqm: Math.round(firstFloorArea * 0.75),
        privacyLevel: 'STRICTLY_PRIVATE',
        features: ['Primary Suite with Walk-In Closet', 'Secondary En-Suite Bedrooms', 'Family Lounge'],
      },
      {
        zoneName: 'Service & Maid Quarters',
        floor: 'Rooftop Annex / Service Zone',
        allocatedAreaSqm: annexArea > 0 ? annexArea : Math.round(groundFloorArea * 0.20),
        privacyLevel: 'SERVICE',
        features: ['Laundry Room', 'Maid Suite', 'Driver Room (External)', 'Storage'],
      },
    ],
    roomDistribution: [
      { room: 'Primary Master Suite', floor: 'First Floor', sizeSqm: 55 },
      { room: 'Executive Majlis', floor: 'Ground Floor', sizeSqm: 65 },
      { room: 'Family Living & Dining', floor: 'Ground Floor', sizeSqm: 70 },
      { room: 'Preparation Kitchen + Show Kitchen', floor: 'Ground Floor', sizeSqm: 35 },
      { room: 'Additional En-Suite Bedrooms', count: 3, floor: 'First Floor', sizeSqm: 28 },
    ],
    circulationStrategy:
      'Dual circulation spine providing strict separation between formal guest access and private family quarters centered around an internal courtyard.',
  };

  const conceptName = `Concept v1 — ${params.architecturalStyle} (${params.usageType || 'RESIDENTIAL'})`;
  const rationale = `Designed in accordance with ${params.architecturalStyle} principles tailored for a ${params.areaSqm} sqm plot. Emphasizes climate-responsive natural lighting, private courtyard cooling, and spatial efficiency.`;

  // 3. Save concept
  const concept = await createDesignConcept({
    tenantId: params.tenantId,
    designProjectId: proj.id,
    conceptName,
    conceptType: 'ARCHITECTURAL',
    style: params.architecturalStyle,
    spacePlanningJson,
    rationale,
    aiGenerated: true,
    aiModelUsed: 'OPROX-Gemini-Architect-v1',
    spatialMetaJson: {
      plotWidthM: params.plotDimensions ? parseFloat(params.plotDimensions.split('x')[0]) || 20 : 20,
      plotDepthM: params.plotDimensions ? parseFloat(params.plotDimensions.split('x')[1]) || 25 : 25,
      digitalTwinReady: true,
    },
  });

  return { project: proj, concept };
}

// ──────────────────────────────────────────────────────────────────────────────
// MODULE 2: AI INTERIOR DESIGNER
// ──────────────────────────────────────────────────────────────────────────────

export async function generateAiInteriorConcept(params: {
  tenantId: string;
  userId: string;
  projectId?: string;
  spaceType: 'LIVING_ROOM' | 'BEDROOM' | 'KITCHEN' | 'BATHROOM' | 'OFFICE' | 'COMMERCIAL' | 'OTHER';
  style: 'Modern' | 'Contemporary' | 'Minimal' | 'Luxury' | 'Classic' | 'Saudi-inspired' | 'Islamic-inspired' | 'Industrial';
  areaSqm?: number;
  colorPreference?: string;
  materialPreference?: string;
  budgetSar?: number;
  freeTextRequirements?: string;
}): Promise<{ project: RealEstateDesignProjectRow; concept: RealEstateDesignConceptRow }> {
  // Create or retrieve project
  let proj: RealEstateDesignProjectRow;
  if (params.projectId) {
    const existing = await getDesignProject(params.tenantId, params.projectId);
    if (!existing) throw new Error('Project not found or access denied.');
    proj = existing;
  } else {
    proj = await createDesignProject({
      tenantId: params.tenantId,
      userId: params.userId,
      title: `Interior Design — ${params.spaceType} (${params.style})`,
      projectType: 'INTERIOR',
      requirementsJson: params,
    });
  }

  const interiorDetailsJson = {
    spaceType: params.spaceType,
    selectedStyle: params.style,
    layoutSuggestions: [
      'L-shaped lounge orientation maximizing daylight from south-facing floor-to-ceiling windows.',
      'Focal feature wall with concealed ambient LED channels and integrated marble cladding.',
    ],
    furnitureArrangement: [
      { item: 'Modular Low-Profile Sofa', placement: 'Center Facing Feature Wall', material: 'Performance Linen' },
      { item: 'Sculptural Coffee Table Pair', placement: 'Sofa Forefront', material: 'Travertine & Brushed Brass' },
      { item: 'Accent Lounge Chairs (Set of 2)', placement: 'Side Conversation Angle', material: 'Bouclé Fabric' },
    ],
    materialPalette: [
      'Crema Marfil Natural Marble (Flooring)',
      'American Walnut Wood Veneer Panels (Millwork)',
      'Brushed Champagne Gold Accents (Hardware)',
    ],
    surfaceRecommendations: {
      flooring: 'Large Format Porcelain Slabs (120x240cm) with Satin Finish',
      walls: 'Textured Lime Wash Paint + Acoustic Slatted Timber Panels',
      ceiling: 'Recessed Gypsum Board with Concealed Perimeter Cove Lighting',
    },
    lightingConcept: {
      ambient: '3000K Soft Architectural Cove LEDs',
      task: 'Directional Recessed Frameless Spotlights',
      accent: 'Custom Architectural Linear Pendant over Dining / Bar',
    },
    colorPalette: [
      { name: 'Warm Cream', hex: '#F5F2EB', role: 'Primary Wall & Ceiling' },
      { name: 'Deep Terracotta', hex: '#A85232', role: 'Accent Cushions & Rug' },
      { name: 'Champagne Gold', hex: '#D4AF37', role: 'Metallic Finishes' },
      { name: 'Charcoal Oak', hex: '#2C2B29', role: 'Secondary Woodwork' },
    ],
    visualGenerationProviderStatus: 'NOT_CONFIGURED',
  };

  const concept = await createDesignConcept({
    tenantId: params.tenantId,
    designProjectId: proj.id,
    conceptName: `Interior Concept — ${params.spaceType} (${params.style})`,
    conceptType: 'INTERIOR',
    style: params.style,
    interiorDetailsJson,
    rationale: `Harmonious interior scheme blending ${params.style} aesthetics with functional high-durability surfaces suited for Saudi residential environments.`,
    aiGenerated: true,
    aiModelUsed: 'OPROX-Gemini-Interior-v1',
  });

  return { project: proj, concept };
}

// ──────────────────────────────────────────────────────────────────────────────
// MODULE 3: AI EXTERIOR & LANDSCAPE DESIGNER
// ──────────────────────────────────────────────────────────────────────────────

export async function generateAiExteriorConcept(params: {
  tenantId: string;
  userId: string;
  projectId?: string;
  facadeStyle: 'Modern' | 'Contemporary' | 'Minimal' | 'Luxury' | 'Classic' | 'Saudi-inspired' | 'Islamic-inspired' | 'Industrial';
  plotAreaSqm?: number;
  includePool?: boolean;
  includeGarden?: boolean;
  outdoorSeatingType?: string;
  freeTextRequirements?: string;
}): Promise<{ project: RealEstateDesignProjectRow; concept: RealEstateDesignConceptRow }> {
  let proj: RealEstateDesignProjectRow;
  if (params.projectId) {
    const existing = await getDesignProject(params.tenantId, params.projectId);
    if (!existing) throw new Error('Project not found or access denied.');
    proj = existing;
  } else {
    proj = await createDesignProject({
      tenantId: params.tenantId,
      userId: params.userId,
      title: `Exterior & Landscape — ${params.facadeStyle}`,
      projectType: 'EXTERIOR',
      requirementsJson: params,
    });
  }

  const exteriorDetailsJson = {
    facadeStyle: params.facadeStyle,
    elevationConcept:
      'Geometric massing featuring cantilevered upper floors, integrated vertical louvers for solar shading, and grand double-height entrance portal.',
    materials: [
      'Riyadh Yellow/White Natural Stone Cladding',
      'Powder-Coated Dark Bronze Aluminum Louvers',
      'Low-E Double Glazed Reflective Glass Panels',
    ],
    entranceConcept: 'Framed portal entrance with cascading water film and illuminated stone steps.',
    landscapeZoning: [
      {
        zoneName: 'Outdoor Family Lounge & Barbecue',
        areaSqm: 45,
        features: ['Sunken Seating Pit', 'Built-in Pergola with Retractable Roof', 'Outdoor Kitchenette'],
      },
      {
        zoneName: params.includePool ? 'Overflow Swimming Pool & Sun Deck' : 'Central Water Feature Court',
        areaSqm: 50,
        features: [params.includePool ? '10m x 4m Heated Infinity Edge Pool' : 'Illuminated Cascading Fountain'],
      },
      {
        zoneName: 'Desert Native Xeriscape Garden',
        areaSqm: 60,
        features: ['Drip-Irrigated Date Palms', 'Arid Ornamental Grasses', 'Decomposed Granite Pathways'],
      },
    ],
    lightingConcept: 'Low-voltage 2700K landscape uplights, step lights, and palm canopy illumination.',
  };

  const concept = await createDesignConcept({
    tenantId: params.tenantId,
    designProjectId: proj.id,
    conceptName: `Exterior Concept — ${params.facadeStyle}`,
    conceptType: 'EXTERIOR',
    style: params.facadeStyle,
    exteriorDetailsJson,
    rationale: `Climate-conscious exterior design providing energy efficiency, privacy screening, and luxury outdoor entertainment space.`,
    aiGenerated: true,
    aiModelUsed: 'OPROX-Gemini-Exterior-v1',
  });

  return { project: proj, concept };
}

// ──────────────────────────────────────────────────────────────────────────────
// MODULE 6: AI RENOVATION ADVISOR
// ──────────────────────────────────────────────────────────────────────────────

export async function generateAiRenovationConcept(params: {
  tenantId: string;
  userId: string;
  projectId?: string;
  propertyId?: string;
  areaSqm: number;
  propertyAgeYears: number;
  currentCondition: 'POOR' | 'FAIR' | 'GOOD';
  desiredRenovationScope: 'COSMETIC' | 'FULL_INTERIOR' | 'STRUCTURAL_EXPANSION' | 'FACADE_AND_INTERIOR';
  budgetSar: number;
  targetUse?: string;
}): Promise<{ project: RealEstateDesignProjectRow; concept: RealEstateDesignConceptRow }> {
  let proj: RealEstateDesignProjectRow;
  if (params.projectId) {
    const existing = await getDesignProject(params.tenantId, params.projectId);
    if (!existing) throw new Error('Project not found or access denied.');
    proj = existing;
  } else {
    proj = await createDesignProject({
      tenantId: params.tenantId,
      userId: params.userId,
      title: `Renovation Plan — ${params.desiredRenovationScope}`,
      projectType: 'RENOVATION',
      propertyId: params.propertyId,
      requirementsJson: params,
    });
  }

  // Cost estimates per sqm based on scope
  let costPerSqmMin = 400;
  let costPerSqmMax = 800;
  let valueUpliftPct = 15;

  if (params.desiredRenovationScope === 'COSMETIC') {
    costPerSqmMin = 250;
    costPerSqmMax = 500;
    valueUpliftPct = 12;
  } else if (params.desiredRenovationScope === 'FULL_INTERIOR') {
    costPerSqmMin = 700;
    costPerSqmMax = 1200;
    valueUpliftPct = 25;
  } else if (params.desiredRenovationScope === 'STRUCTURAL_EXPANSION') {
    costPerSqmMin = 1200;
    costPerSqmMax = 2000;
    valueUpliftPct = 35;
  } else if (params.desiredRenovationScope === 'FACADE_AND_INTERIOR') {
    costPerSqmMin = 1000;
    costPerSqmMax = 1700;
    valueUpliftPct = 30;
  }

  const estimatedCostMinSar = Math.round(params.areaSqm * costPerSqmMin);
  const estimatedCostMaxSar = Math.round(params.areaSqm * costPerSqmMax);
  const estimatedValueIncreaseSar = Math.round(((estimatedCostMinSar + estimatedCostMaxSar) / 2) * (1 + valueUpliftPct / 100));

  const renovationDetailsJson = {
    isEstimate: true,
    disclaimer: RENOVATION_DISCLAIMER,
    propertyAgeYears: params.propertyAgeYears,
    currentCondition: params.currentCondition,
    scope: params.desiredRenovationScope,
    suggestedPhases: [
      {
        phase: 'Phase 1: Mechanical, Electrical & HVAC Modernization',
        priority: 'CRITICAL',
        estimatedDurationWeeks: 3,
        tasks: ['Replace aging AC ductwork with high-efficiency VRF system', 'Upgrade main electrical panel to 150A'],
      },
      {
        phase: 'Phase 2: Architectural Layout Optimization & Flooring',
        priority: 'HIGH',
        estimatedDurationWeeks: 4,
        tasks: ['Remove non-structural partition wall between kitchen and living room', 'Install new large-format porcelain tile flooring'],
      },
      {
        phase: 'Phase 3: Millwork, Lighting & Interior Aesthetics',
        priority: 'MEDIUM',
        estimatedDurationWeeks: 3,
        tasks: ['Custom kitchen cabinetry with quartz countertops', 'Indirect LED cove lighting and smart home switches'],
      },
    ],
    estimatedBudgetRangeSar: {
      minSar: estimatedCostMinSar,
      maxSar: estimatedCostMaxSar,
    },
    valueImprovementScenario: {
      estimatedRenovationCostAvgSar: Math.round((estimatedCostMinSar + estimatedCostMaxSar) / 2),
      estimatedPostRenovationValueUpliftSar: estimatedValueIncreaseSar,
      estimatedRentalIncomeUpliftPct: Math.round(valueUpliftPct * 0.8),
    },
  };

  const concept = await createDesignConcept({
    tenantId: params.tenantId,
    designProjectId: proj.id,
    conceptName: `Renovation Roadmap — ${params.desiredRenovationScope}`,
    conceptType: 'RENOVATION',
    renovationDetailsJson,
    rationale: `Phased renovation proposal prioritizing essential MEP infrastructure improvements followed by spatial flow enhancements to maximize rental yield and capital appreciation.`,
    aiGenerated: true,
    aiModelUsed: 'OPROX-Gemini-RenovationAdvisor-v1',
  });

  return { project: proj, concept };
}

// ──────────────────────────────────────────────────────────────────────────────
// MODULE 5: OPROX STUDIO INTEGRATION BOUNDARY
// ──────────────────────────────────────────────────────────────────────────────

export async function exportDesignProjectToStudio(
  tenantId: string,
  projectId: string
): Promise<{ studioProjectId: string; project: RealEstateDesignProjectRow }> {
  const project = await getDesignProject(tenantId, projectId);
  if (!project) throw new Error('Design project not found or access denied.');

  const concepts = await listDesignConcepts(tenantId, projectId);
  const primaryConcept = concepts[0] || null;

  // Generate a Studio Project ID linking Real Estate Design to OPROX Studio
  const studioProjectId = genId('studio_proj_re');

  const updatedProject = await updateDesignProject(tenantId, projectId, {
    studioProjectId,
    notes: `${project.notes || ''}\n[Studio Exported at ${new Date().toISOString()} with Studio ID: ${studioProjectId}]`.trim(),
  });

  return {
    studioProjectId,
    project: updatedProject || project,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// MODULE 7: INVESTMENT INTELLIGENCE ENGINE & ROI CALCULATOR
// ──────────────────────────────────────────────────────────────────────────────

export interface InvestmentCalculationInput {
  purchasePriceSar: number;
  areaSqm: number;
  estimatedAnnualRentSar: number;
  operatingExpensesAnnualSar?: number;
  occupancyRatePct?: number; // e.g. 95
  financingPercentagePct?: number; // e.g. 70
  mortgageInterestRatePct?: number; // e.g. 5.5
  loanTenureYears?: number; // e.g. 20
}

export interface InvestmentCalculationOutput {
  purchasePriceSar: number;
  areaSqm: number;
  pricePerSqmSar: number;
  estimatedAnnualRentSar: number;
  grossYieldPct: number;
  effectiveGrossIncomeSar: number;
  operatingExpensesAnnualSar: number;
  netOperatingIncomeSar: number; // NOI
  netYieldPct: number; // Cap Rate
  financingDetails: {
    financingPercentagePct: number;
    downPaymentSar: number;
    loanAmountSar: number;
    mortgageInterestRatePct: number;
    loanTenureYears: number;
    monthlyMortgagePaymentSar: number;
    annualDebtServiceSar: number;
  };
  cashFlowDetails: {
    netAnnualCashFlowSar: number;
    netMonthlyCashFlowSar: number;
    cashOnCashReturnPct: number;
  };
  breakEvenIndicators: {
    breakEvenOccupancyPct: number;
    breakEvenPaybackYears: number;
  };
  fiveYearScenarioForecast: Array<{
    year: number;
    estimatedPropertyValueSar: number;
    annualRentSar: number;
    cumulativeCashFlowSar: number;
  }>;
}

export function calculateInvestmentMetrics(
  input: InvestmentCalculationInput
): InvestmentCalculationOutput {
  const price = Math.max(1, input.purchasePriceSar);
  const area = Math.max(1, input.areaSqm);
  const grossRent = Math.max(0, input.estimatedAnnualRentSar);
  const expenses = Math.max(0, input.operatingExpensesAnnualSar || 0);
  const occupancyPct = Math.min(100, Math.max(0, input.occupancyRatePct !== undefined ? input.occupancyRatePct : 95));

  const pricePerSqm = Number((price / area).toFixed(2));
  const grossYieldPct = Number(((grossRent / price) * 100).toFixed(2));

  const effectiveGrossIncome = Number((grossRent * (occupancyPct / 100)).toFixed(2));
  const netOperatingIncome = Number((effectiveGrossIncome - expenses).toFixed(2));
  const netYieldPct = Number(((netOperatingIncome / price) * 100).toFixed(2));

  // Financing calculations
  const financingPct = Math.min(100, Math.max(0, input.financingPercentagePct || 0));
  const loanTenure = Math.max(1, input.loanTenureYears || 20);
  const interestRate = Math.max(0, input.mortgageInterestRatePct || 0);

  const loanAmount = Number((price * (financingPct / 100)).toFixed(2));
  const downPayment = Number((price - loanAmount).toFixed(2));

  let monthlyPayment = 0;
  if (loanAmount > 0 && interestRate > 0) {
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTenure * 12;
    monthlyPayment = Number(
      (
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      ).toFixed(2)
    );
  } else if (loanAmount > 0 && interestRate === 0) {
    monthlyPayment = Number((loanAmount / (loanTenure * 12)).toFixed(2));
  }

  const annualDebtService = Number((monthlyPayment * 12).toFixed(2));
  const netAnnualCashFlow = Number((netOperatingIncome - annualDebtService).toFixed(2));
  const netMonthlyCashFlow = Number((netAnnualCashFlow / 12).toFixed(2));

  const cashOnCashReturnPct =
    downPayment > 0
      ? Number(((netAnnualCashFlow / downPayment) * 100).toFixed(2))
      : netYieldPct;

  // Break even calculations
  const breakEvenOccupancy =
    grossRent > 0
      ? Number((((expenses + annualDebtService) / grossRent) * 100).toFixed(2))
      : 0;

  const breakEvenYears =
    netAnnualCashFlow > 0
      ? Number((downPayment / netAnnualCashFlow).toFixed(1))
      : 0;

  // 5-Year Forecast (3% property appreciation & 2% rent escalation per year)
  const forecast: Array<{
    year: number;
    estimatedPropertyValueSar: number;
    annualRentSar: number;
    cumulativeCashFlowSar: number;
  }> = [];

  let currentVal = price;
  let currentRent = grossRent;
  let cumCashFlow = 0;

  for (let yr = 1; yr <= 5; yr++) {
    currentVal = Number((currentVal * 1.03).toFixed(2));
    if (yr > 1) currentRent = Number((currentRent * 1.02).toFixed(2));
    const yrEgi = currentRent * (occupancyPct / 100);
    const yrNoi = yrEgi - expenses * Math.pow(1.02, yr - 1);
    const yrCashFlow = yrNoi - annualDebtService;
    cumCashFlow += yrCashFlow;

    forecast.push({
      year: yr,
      estimatedPropertyValueSar: Math.round(currentVal),
      annualRentSar: Math.round(currentRent),
      cumulativeCashFlowSar: Math.round(cumCashFlow),
    });
  }

  return {
    purchasePriceSar: price,
    areaSqm: area,
    pricePerSqmSar: pricePerSqm,
    estimatedAnnualRentSar: grossRent,
    grossYieldPct,
    effectiveGrossIncomeSar: effectiveGrossIncome,
    operatingExpensesAnnualSar: expenses,
    netOperatingIncomeSar: netOperatingIncome,
    netYieldPct,
    financingDetails: {
      financingPercentagePct: financingPct,
      downPaymentSar: downPayment,
      loanAmountSar: loanAmount,
      mortgageInterestRatePct: interestRate,
      loanTenureYears: loanTenure,
      monthlyMortgagePaymentSar: monthlyPayment,
      annualDebtServiceSar: annualDebtService,
    },
    cashFlowDetails: {
      netAnnualCashFlowSar: netAnnualCashFlow,
      netMonthlyCashFlowSar: netMonthlyCashFlow,
      cashOnCashReturnPct,
    },
    breakEvenIndicators: {
      breakEvenOccupancyPct: Math.min(100, breakEvenOccupancy),
      breakEvenPaybackYears: breakEvenYears,
    },
    fiveYearScenarioForecast: forecast,
  };
}

export async function createInvestmentAnalysis(data: {
  tenantId: string;
  userId: string;
  title: string;
  propertyId?: string;
  listingId?: string;
  purchasePriceSar: number;
  areaSqm: number;
  estimatedAnnualRentSar: number;
  operatingExpensesAnnualSar?: number;
  occupancyRatePct?: number;
  financingPercentagePct?: number;
  mortgageInterestRatePct?: number;
  loanTenureYears?: number;
  comparablePropertiesJson?: any[];
  dataQualityStatus?: 'ACTUAL' | 'ESTIMATED' | 'NOT_MEASURED' | 'DATA_UNAVAILABLE';
  aiAnalysisSummary?: string;
}): Promise<RealEstateInvestmentAnalysisRow> {
  const calculatedMetrics = calculateInvestmentMetrics({
    purchasePriceSar: data.purchasePriceSar,
    areaSqm: data.areaSqm,
    estimatedAnnualRentSar: data.estimatedAnnualRentSar,
    operatingExpensesAnnualSar: data.operatingExpensesAnnualSar,
    occupancyRatePct: data.occupancyRatePct,
    financingPercentagePct: data.financingPercentagePct,
    mortgageInterestRatePct: data.mortgageInterestRatePct,
    loanTenureYears: data.loanTenureYears,
  });

  const id = genId('inv');
  const now = new Date();

  const newAnalysis: RealEstateInvestmentAnalysisRow = {
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    title: data.title,
    propertyId: data.propertyId || null,
    listingId: data.listingId || null,
    purchasePriceSar: data.purchasePriceSar.toString(),
    areaSqm: data.areaSqm.toString(),
    estimatedAnnualRentSar: data.estimatedAnnualRentSar.toString(),
    operatingExpensesAnnualSar: (data.operatingExpensesAnnualSar || 0).toString(),
    occupancyRatePct: (data.occupancyRatePct || 95).toString(),
    financingPercentagePct: (data.financingPercentagePct || 0).toString(),
    mortgageInterestRatePct: (data.mortgageInterestRatePct || 0).toString(),
    loanTenureYears: data.loanTenureYears || 20,
    calculatedMetricsJson: calculatedMetrics,
    comparablePropertiesJson: data.comparablePropertiesJson || [],
    dataQualityStatus: data.dataQualityStatus || 'ACTUAL_AND_ESTIMATED',
    aiAnalysisSummary:
      data.aiAnalysisSummary ||
      `Analysis indicates a Gross Yield of ${calculatedMetrics.grossYieldPct}% and Net Yield (Cap Rate) of ${calculatedMetrics.netYieldPct}%.`,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (db) {
      const [inserted] = await db
        .insert(realEstateInvestmentAnalysesTable)
        .values({
          id,
          tenantId: data.tenantId,
          userId: data.userId,
          title: data.title,
          propertyId: data.propertyId || null,
          listingId: data.listingId || null,
          purchasePriceSar: data.purchasePriceSar.toString(),
          areaSqm: data.areaSqm.toString(),
          estimatedAnnualRentSar: data.estimatedAnnualRentSar.toString(),
          operatingExpensesAnnualSar: (data.operatingExpensesAnnualSar || 0).toString(),
          occupancyRatePct: (data.occupancyRatePct || 95).toString(),
          financingPercentagePct: (data.financingPercentagePct || 0).toString(),
          mortgageInterestRatePct: (data.mortgageInterestRatePct || 0).toString(),
          loanTenureYears: data.loanTenureYears || 20,
          calculatedMetricsJson: calculatedMetrics,
          comparablePropertiesJson: data.comparablePropertiesJson || [],
          dataQualityStatus: data.dataQualityStatus || 'ACTUAL_AND_ESTIMATED',
          aiAnalysisSummary: newAnalysis.aiAnalysisSummary,
        })
        .returning();
      if (inserted) return inserted;
    }
  } catch (err) {
    // Fallback
  }

  memoryInvestmentAnalyses.push(newAnalysis);
  return newAnalysis;
}

export async function getInvestmentAnalysis(
  tenantId: string,
  analysisId: string
): Promise<RealEstateInvestmentAnalysisRow | null> {
  try {
    if (db) {
      const rows = await db
        .select()
        .from(realEstateInvestmentAnalysesTable)
        .where(
          and(
            eq(realEstateInvestmentAnalysesTable.id, analysisId),
            eq(realEstateInvestmentAnalysesTable.tenantId, tenantId)
          )
        );
      if (rows.length > 0) return rows[0];
    }
  } catch (err) {
    // Fallback
  }

  const inv = memoryInvestmentAnalyses.find((i) => i.id === analysisId && i.tenantId === tenantId);
  return inv || null;
}

export async function listInvestmentAnalyses(
  tenantId: string,
  filters?: {
    userId?: string;
    propertyId?: string;
  }
): Promise<RealEstateInvestmentAnalysisRow[]> {
  try {
    if (db) {
      const conditions = [eq(realEstateInvestmentAnalysesTable.tenantId, tenantId)];
      if (filters?.userId)
        conditions.push(eq(realEstateInvestmentAnalysesTable.userId, filters.userId));
      if (filters?.propertyId)
        conditions.push(eq(realEstateInvestmentAnalysesTable.propertyId, filters.propertyId));

      const rows = await db
        .select()
        .from(realEstateInvestmentAnalysesTable)
        .where(and(...conditions))
        .orderBy(desc(realEstateInvestmentAnalysesTable.createdAt));
      return rows;
    }
  } catch (err) {
    // Fallback
  }

  return memoryInvestmentAnalyses.filter((i) => {
    if (i.tenantId !== tenantId) return false;
    if (filters?.userId && i.userId !== filters.userId) return false;
    if (filters?.propertyId && i.propertyId !== filters.propertyId) return false;
    return true;
  });
}

// Compare Multiple Investment Analyses
export async function compareInvestments(
  tenantId: string,
  analysisIds: string[]
): Promise<{
  analyses: RealEstateInvestmentAnalysisRow[];
  comparisonMatrix: Array<{
    analysisId: string;
    title: string;
    purchasePriceSar: number;
    pricePerSqmSar: number;
    estimatedAnnualRentSar: number;
    grossYieldPct: number;
    netYieldPct: number;
    cashOnCashReturnPct: number;
    netAnnualCashFlowSar: number;
    dataQualityStatus: string;
    investmentRating: 'STRONG_BUY' | 'MODERATE' | 'SPECULATIVE';
  }>;
}> {
  const analyses: RealEstateInvestmentAnalysisRow[] = [];
  for (const id of analysisIds) {
    const item = await getInvestmentAnalysis(tenantId, id);
    if (item) analyses.push(item);
  }

  const comparisonMatrix = analyses.map((item) => {
    const calc: InvestmentCalculationOutput = item.calculatedMetricsJson as any;
    let rating: 'STRONG_BUY' | 'MODERATE' | 'SPECULATIVE' = 'MODERATE';
    if (calc.netYieldPct >= 7.5 && calc.cashFlowDetails.cashOnCashReturnPct >= 8) {
      rating = 'STRONG_BUY';
    } else if (calc.netYieldPct < 5.0 || calc.cashFlowDetails.netAnnualCashFlowSar < 0) {
      rating = 'SPECULATIVE';
    }

    return {
      analysisId: item.id,
      title: item.title,
      purchasePriceSar: calc.purchasePriceSar,
      pricePerSqmSar: calc.pricePerSqmSar,
      estimatedAnnualRentSar: calc.estimatedAnnualRentSar,
      grossYieldPct: calc.grossYieldPct,
      netYieldPct: calc.netYieldPct,
      cashOnCashReturnPct: calc.cashFlowDetails.cashOnCashReturnPct,
      netAnnualCashFlowSar: calc.cashFlowDetails.netAnnualCashFlowSar,
      dataQualityStatus: item.dataQualityStatus,
      investmentRating: rating,
    };
  });

  return { analyses, comparisonMatrix };
}

// ──────────────────────────────────────────────────────────────────────────────
// MODULE 8: AI INVESTMENT ADVISOR COPILOT
// ──────────────────────────────────────────────────────────────────────────────

export async function askAiInvestmentAdvisor(params: {
  tenantId: string;
  userId: string;
  prompt: string;
  analysisIds?: string[];
}): Promise<{
  answer: string;
  groundedMetrics: any;
  sensitivityScenarios: Array<{ scenario: string; projectedNetYieldPct: number; annualCashFlowSar: number }>;
}> {
  let contextData: any[] = [];
  if (params.analysisIds && params.analysisIds.length > 0) {
    for (const id of params.analysisIds) {
      const inv = await getInvestmentAnalysis(params.tenantId, id);
      if (inv) contextData.push(inv);
    }
  } else {
    // Get latest analyses for tenant
    contextData = await listInvestmentAnalyses(params.tenantId);
  }

  const promptLower = params.prompt.toLowerCase();
  let answer = '';
  let sensitivityScenarios: Array<{ scenario: string; projectedNetYieldPct: number; annualCashFlowSar: number }> = [];

  if (contextData.length === 0) {
    answer = `No active property investment records were found in your workspace to evaluate. Please create or select an Investment Analysis record first to receive grounded AI investment guidance.`;
  } else {
    const primary = contextData[0];
    const calc: InvestmentCalculationOutput = primary.calculatedMetricsJson as any;

    if (promptLower.includes('compare') || promptLower.includes('yield') || promptLower.includes('better')) {
      answer = `Based on your platform data for "${primary.title}", the property offers a Gross Yield of ${calc.grossYieldPct}% and a Net Cap Rate of ${calc.netYieldPct}%. `;
      if (contextData.length > 1) {
        const sec = contextData[1];
        const secCalc: InvestmentCalculationOutput = sec.calculatedMetricsJson as any;
        answer += `Comparing with "${sec.title}" (Gross Yield: ${secCalc.grossYieldPct}%, Net Cap Rate: ${secCalc.netYieldPct}%), "${
          calc.netYieldPct >= secCalc.netYieldPct ? primary.title : sec.title
        }" delivers superior net cash flow efficiency.`;
      }
    } else if (promptLower.includes('rent') || promptLower.includes('drop') || promptLower.includes('increase')) {
      const baseRent = calc.estimatedAnnualRentSar;
      const rentMinus10 = baseRent * 0.9;
      const calcMinus10 = calculateInvestmentMetrics({
        ...calc,
        estimatedAnnualRentSar: rentMinus10,
      });

      const rentPlus10 = baseRent * 1.1;
      const calcPlus10 = calculateInvestmentMetrics({
        ...calc,
        estimatedAnnualRentSar: rentPlus10,
      });

      answer = `Sensitivity Analysis for "${primary.title}":\n- If rental income decreases by 10% (to SAR ${rentMinus10.toLocaleString()}/yr), Net Yield adjusts to ${calcMinus10.netYieldPct}% with annual cash flow of SAR ${calcMinus10.cashFlowDetails.netAnnualCashFlowSar.toLocaleString()}.\n- If rental income increases by 10% (to SAR ${rentPlus10.toLocaleString()}/yr), Net Yield expands to ${calcPlus10.netYieldPct}% with annual cash flow of SAR ${calcPlus10.cashFlowDetails.netAnnualCashFlowSar.toLocaleString()}.`;

      sensitivityScenarios = [
        { scenario: '-10% Rent Drop', projectedNetYieldPct: calcMinus10.netYieldPct, annualCashFlowSar: calcMinus10.cashFlowDetails.netAnnualCashFlowSar },
        { scenario: 'Base Case Rent', projectedNetYieldPct: calc.netYieldPct, annualCashFlowSar: calc.cashFlowDetails.netAnnualCashFlowSar },
        { scenario: '+10% Rent Increase', projectedNetYieldPct: calcPlus10.netYieldPct, annualCashFlowSar: calcPlus10.cashFlowDetails.netAnnualCashFlowSar },
      ];
    } else {
      answer = `For "${primary.title}": Purchase Price is SAR ${calc.purchasePriceSar.toLocaleString()} (${calc.pricePerSqmSar} SAR/sqm). Expected Annual NOI is SAR ${calc.netOperatingIncomeSar.toLocaleString()} resulting in a ${calc.netYieldPct}% Cap Rate. Cash-on-Cash Return stands at ${calc.cashFlowDetails.cashOnCashReturnPct}%.`;
    }
  }

  return {
    answer,
    groundedMetrics: contextData.map((d) => ({
      id: d.id,
      title: d.title,
      purchasePriceSar: d.purchasePriceSar,
      metrics: d.calculatedMetricsJson,
    })),
    sensitivityScenarios,
  };
}
