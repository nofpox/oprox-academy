/**
 * OPROX Real Estate Phase 1 — Store & Service Layer
 * Data access and business logic for Portfolios, Properties, Buildings, Floors, Units, Owners, and Dashboard.
 */

import { eq, and, sql, desc, ilike, inArray } from 'drizzle-orm';
import { db } from '../../db';
import {
  realEstatePortfoliosTable,
  realEstatePropertiesTable,
  realEstateBuildingsTable,
  realEstateFloorsTable,
  realEstateUnitsTable,
  realEstateOwnersTable,
  realEstatePropertyOwnersTable,
  realEstateAmenitiesTable,
  RealEstatePortfolioRow,
  RealEstatePropertyRow,
  RealEstateBuildingRow,
  RealEstateFloorRow,
  RealEstateUnitRow,
  RealEstateOwnerRow,
  RealEstatePropertyOwnerRow,
  RealEstateAmenityRow,
} from '../../db/schema';

// In-Memory Fallback Stores for Non-DB / Test environment
const memoryPortfolios: RealEstatePortfolioRow[] = [];
const memoryProperties: RealEstatePropertyRow[] = [];
const memoryBuildings: RealEstateBuildingRow[] = [];
const memoryFloors: RealEstateFloorRow[] = [];
const memoryUnits: RealEstateUnitRow[] = [];
const memoryOwners: RealEstateOwnerRow[] = [];
const memoryPropertyOwners: RealEstatePropertyOwnerRow[] = [];
const memoryAmenities: RealEstateAmenityRow[] = [];

// Helper to generate IDs
function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
}

// ── PORTFOLIOS ─────────────────────────────────────────────────────────────

export async function listPortfolios(tenantId: string): Promise<RealEstatePortfolioRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstatePortfoliosTable)
      .where(and(eq(realEstatePortfoliosTable.tenantId, tenantId), eq(realEstatePortfoliosTable.status, 'active')))
      .orderBy(desc(realEstatePortfoliosTable.createdAt));
  }
  return memoryPortfolios.filter((p) => p.tenantId === tenantId && p.status === 'active');
}

export async function getPortfolio(tenantId: string, portfolioId: string): Promise<RealEstatePortfolioRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstatePortfoliosTable)
      .where(and(eq(realEstatePortfoliosTable.tenantId, tenantId), eq(realEstatePortfoliosTable.id, portfolioId)));
    return res[0] || null;
  }
  return memoryPortfolios.find((p) => p.tenantId === tenantId && p.id === portfolioId) || null;
}

export async function createPortfolio(data: {
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
  createdBy: string;
}): Promise<RealEstatePortfolioRow> {
  const row: RealEstatePortfolioRow = {
    id: genId('fol'),
    tenantId: data.tenantId,
    name: data.name,
    code: data.code || null,
    description: data.description || null,
    status: 'active',
    createdBy: data.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstatePortfoliosTable).values(row);
    return row;
  }
  memoryPortfolios.push(row);
  return row;
}

export async function updatePortfolio(
  tenantId: string,
  portfolioId: string,
  updates: Partial<RealEstatePortfolioRow>
): Promise<RealEstatePortfolioRow | null> {
  if (db) {
    const res = await db
      .update(realEstatePortfoliosTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(realEstatePortfoliosTable.tenantId, tenantId), eq(realEstatePortfoliosTable.id, portfolioId)))
      .returning();
    return res[0] || null;
  }
  const idx = memoryPortfolios.findIndex((p) => p.tenantId === tenantId && p.id === portfolioId);
  if (idx === -1) return null;
  memoryPortfolios[idx] = { ...memoryPortfolios[idx], ...updates, updatedAt: new Date() };
  return memoryPortfolios[idx];
}

export async function deletePortfolio(tenantId: string, portfolioId: string): Promise<boolean> {
  if (db) {
    const res = await db
      .delete(realEstatePortfoliosTable)
      .where(and(eq(realEstatePortfoliosTable.tenantId, tenantId), eq(realEstatePortfoliosTable.id, portfolioId)))
      .returning();
    return res.length > 0;
  }
  const idx = memoryPortfolios.findIndex((p) => p.tenantId === tenantId && p.id === portfolioId);
  if (idx === -1) return false;
  memoryPortfolios.splice(idx, 1);
  return true;
}

// ── PROPERTIES ─────────────────────────────────────────────────────────────

export interface PropertyFilterOptions {
  portfolioId?: string;
  type?: string;
  status?: string;
  city?: string;
  search?: string;
}

export async function listProperties(
  tenantId: string,
  filters?: PropertyFilterOptions
): Promise<RealEstatePropertyRow[]> {
  if (db) {
    const conds = [eq(realEstatePropertiesTable.tenantId, tenantId)];
    if (filters?.portfolioId) conds.push(eq(realEstatePropertiesTable.portfolioId, filters.portfolioId));
    if (filters?.type) conds.push(eq(realEstatePropertiesTable.type, filters.type));
    if (filters?.status) conds.push(eq(realEstatePropertiesTable.status, filters.status));
    if (filters?.city) conds.push(eq(realEstatePropertiesTable.addressCity, filters.city));

    let query = db.select().from(realEstatePropertiesTable).where(and(...conds)).orderBy(desc(realEstatePropertiesTable.createdAt));
    let results = await query;

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.type.toLowerCase().includes(s) ||
          (p.addressCity && p.addressCity.toLowerCase().includes(s)) ||
          (p.addressDistrict && p.addressDistrict.toLowerCase().includes(s))
      );
    }
    return results;
  }

  return memoryProperties.filter((p) => {
    if (p.tenantId !== tenantId) return false;
    if (filters?.portfolioId && p.portfolioId !== filters.portfolioId) return false;
    if (filters?.type && p.type !== filters.type) return false;
    if (filters?.status && p.status !== filters.status) return false;
    if (filters?.city && p.addressCity !== filters.city) return false;
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(s);
      const matchType = p.type.toLowerCase().includes(s);
      const matchCity = p.addressCity ? p.addressCity.toLowerCase().includes(s) : false;
      const matchDistrict = p.addressDistrict ? p.addressDistrict.toLowerCase().includes(s) : false;
      if (!matchName && !matchType && !matchCity && !matchDistrict) return false;
    }
    return true;
  });
}

export async function getProperty(tenantId: string, propertyId: string): Promise<RealEstatePropertyRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstatePropertiesTable)
      .where(and(eq(realEstatePropertiesTable.tenantId, tenantId), eq(realEstatePropertiesTable.id, propertyId)));
    return res[0] || null;
  }
  return memoryProperties.find((p) => p.tenantId === tenantId && p.id === propertyId) || null;
}

export async function createProperty(data: {
  tenantId: string;
  portfolioId?: string;
  name: string;
  type: string;
  status?: string;
  description?: string;
  addressRegion?: string;
  addressCity?: string;
  addressDistrict?: string;
  addressStreet?: string;
  postalCode?: string;
  buildingNumber?: string;
  additionalNumber?: string;
  latitude?: string;
  longitude?: string;
  totalAreaSqm?: string;
  builtUpAreaSqm?: string;
  yearBuilt?: number;
  createdBy: string;
}): Promise<RealEstatePropertyRow> {
  const row: RealEstatePropertyRow = {
    id: genId('prop'),
    tenantId: data.tenantId,
    portfolioId: data.portfolioId || null,
    name: data.name,
    type: data.type,
    status: data.status || 'DRAFT',
    description: data.description || null,
    addressRegion: data.addressRegion || null,
    addressCity: data.addressCity || null,
    addressDistrict: data.addressDistrict || null,
    addressStreet: data.addressStreet || null,
    postalCode: data.postalCode || null,
    buildingNumber: data.buildingNumber || null,
    additionalNumber: data.additionalNumber || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    totalAreaSqm: data.totalAreaSqm || null,
    builtUpAreaSqm: data.builtUpAreaSqm || null,
    yearBuilt: data.yearBuilt || null,
    totalUnitsCount: 0,
    createdBy: data.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstatePropertiesTable).values(row);
    return row;
  }
  memoryProperties.push(row);
  return row;
}

export async function updateProperty(
  tenantId: string,
  propertyId: string,
  updates: Partial<RealEstatePropertyRow>
): Promise<RealEstatePropertyRow | null> {
  if (db) {
    const res = await db
      .update(realEstatePropertiesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(realEstatePropertiesTable.tenantId, tenantId), eq(realEstatePropertiesTable.id, propertyId)))
      .returning();
    return res[0] || null;
  }
  const idx = memoryProperties.findIndex((p) => p.tenantId === tenantId && p.id === propertyId);
  if (idx === -1) return null;
  memoryProperties[idx] = { ...memoryProperties[idx], ...updates, updatedAt: new Date() };
  return memoryProperties[idx];
}

export async function deleteProperty(tenantId: string, propertyId: string): Promise<boolean> {
  if (db) {
    const res = await db
      .delete(realEstatePropertiesTable)
      .where(and(eq(realEstatePropertiesTable.tenantId, tenantId), eq(realEstatePropertiesTable.id, propertyId)))
      .returning();
    return res.length > 0;
  }
  const idx = memoryProperties.findIndex((p) => p.tenantId === tenantId && p.id === propertyId);
  if (idx === -1) return false;
  memoryProperties.splice(idx, 1);
  return true;
}

// ── BUILDINGS ──────────────────────────────────────────────────────────────

export async function listBuildings(tenantId: string, propertyId: string): Promise<RealEstateBuildingRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateBuildingsTable)
      .where(and(eq(realEstateBuildingsTable.tenantId, tenantId), eq(realEstateBuildingsTable.propertyId, propertyId)));
  }
  return memoryBuildings.filter((b) => b.tenantId === tenantId && b.propertyId === propertyId);
}

export async function createBuilding(data: {
  tenantId: string;
  propertyId: string;
  name: string;
  code?: string;
  totalFloors?: number;
}): Promise<RealEstateBuildingRow> {
  const row: RealEstateBuildingRow = {
    id: genId('bldg'),
    tenantId: data.tenantId,
    propertyId: data.propertyId,
    name: data.name,
    code: data.code || null,
    totalFloors: data.totalFloors || 1,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateBuildingsTable).values(row);
    return row;
  }
  memoryBuildings.push(row);
  return row;
}

export async function deleteBuilding(tenantId: string, buildingId: string): Promise<boolean> {
  if (db) {
    const res = await db
      .delete(realEstateBuildingsTable)
      .where(and(eq(realEstateBuildingsTable.tenantId, tenantId), eq(realEstateBuildingsTable.id, buildingId)))
      .returning();
    return res.length > 0;
  }
  const idx = memoryBuildings.findIndex((b) => b.tenantId === tenantId && b.id === buildingId);
  if (idx === -1) return false;
  memoryBuildings.splice(idx, 1);
  return true;
}

// ── FLOORS ─────────────────────────────────────────────────────────────────

export async function listFloors(tenantId: string, buildingId: string): Promise<RealEstateFloorRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateFloorsTable)
      .where(and(eq(realEstateFloorsTable.tenantId, tenantId), eq(realEstateFloorsTable.buildingId, buildingId)));
  }
  return memoryFloors.filter((f) => f.tenantId === tenantId && f.buildingId === buildingId);
}

export async function createFloor(data: {
  tenantId: string;
  buildingId: string;
  floorNumber: number;
  name: string;
}): Promise<RealEstateFloorRow> {
  const row: RealEstateFloorRow = {
    id: genId('flr'),
    tenantId: data.tenantId,
    buildingId: data.buildingId,
    floorNumber: data.floorNumber,
    name: data.name,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateFloorsTable).values(row);
    return row;
  }
  memoryFloors.push(row);
  return row;
}

export async function deleteFloor(tenantId: string, floorId: string): Promise<boolean> {
  if (db) {
    const res = await db
      .delete(realEstateFloorsTable)
      .where(and(eq(realEstateFloorsTable.tenantId, tenantId), eq(realEstateFloorsTable.id, floorId)))
      .returning();
    return res.length > 0;
  }
  const idx = memoryFloors.findIndex((f) => f.tenantId === tenantId && f.id === floorId);
  if (idx === -1) return false;
  memoryFloors.splice(idx, 1);
  return true;
}

// ── UNITS ──────────────────────────────────────────────────────────────────

export async function listUnits(tenantId: string, propertyId?: string): Promise<RealEstateUnitRow[]> {
  if (db) {
    const conds = [eq(realEstateUnitsTable.tenantId, tenantId)];
    if (propertyId) conds.push(eq(realEstateUnitsTable.propertyId, propertyId));
    return await db.select().from(realEstateUnitsTable).where(and(...conds));
  }
  return memoryUnits.filter((u) => {
    if (u.tenantId !== tenantId) return false;
    if (propertyId && u.propertyId !== propertyId) return false;
    return true;
  });
}

export async function getUnit(tenantId: string, unitId: string): Promise<RealEstateUnitRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstateUnitsTable)
      .where(and(eq(realEstateUnitsTable.tenantId, tenantId), eq(realEstateUnitsTable.id, unitId)));
    return res[0] || null;
  }
  return memoryUnits.find((u) => u.tenantId === tenantId && u.id === unitId) || null;
}

export async function createUnit(data: {
  tenantId: string;
  propertyId: string;
  buildingId?: string;
  floorId?: string;
  unitNumber: string;
  unitType?: string;
  status?: string;
  areaSqm?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentPriceSar?: string;
  salePriceSar?: string;
  description?: string;
}): Promise<RealEstateUnitRow> {
  const row: RealEstateUnitRow = {
    id: genId('unit'),
    tenantId: data.tenantId,
    propertyId: data.propertyId,
    buildingId: data.buildingId || null,
    floorId: data.floorId || null,
    unitNumber: data.unitNumber,
    unitType: data.unitType || 'apartment',
    status: data.status || 'AVAILABLE',
    areaSqm: data.areaSqm || null,
    bedrooms: data.bedrooms || null,
    bathrooms: data.bathrooms || null,
    rentPriceSar: data.rentPriceSar || null,
    salePriceSar: data.salePriceSar || null,
    description: data.description || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateUnitsTable).values(row);
    // Update property total units count
    const propUnits = await listUnits(data.tenantId, data.propertyId);
    await updateProperty(data.tenantId, data.propertyId, { totalUnitsCount: propUnits.length });
    return row;
  }

  memoryUnits.push(row);
  const propUnitsMem = memoryUnits.filter((u) => u.tenantId === data.tenantId && u.propertyId === data.propertyId);
  const pIdx = memoryProperties.findIndex((p) => p.tenantId === data.tenantId && p.id === data.propertyId);
  if (pIdx !== -1) {
    memoryProperties[pIdx].totalUnitsCount = propUnitsMem.length;
  }

  return row;
}

export async function updateUnit(
  tenantId: string,
  unitId: string,
  updates: Partial<RealEstateUnitRow>
): Promise<RealEstateUnitRow | null> {
  if (db) {
    const res = await db
      .update(realEstateUnitsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(realEstateUnitsTable.tenantId, tenantId), eq(realEstateUnitsTable.id, unitId)))
      .returning();
    return res[0] || null;
  }
  const idx = memoryUnits.findIndex((u) => u.tenantId === tenantId && u.id === unitId);
  if (idx === -1) return null;
  memoryUnits[idx] = { ...memoryUnits[idx], ...updates, updatedAt: new Date() };
  return memoryUnits[idx];
}

export async function deleteUnit(tenantId: string, unitId: string): Promise<boolean> {
  if (db) {
    const target = await getUnit(tenantId, unitId);
    const res = await db
      .delete(realEstateUnitsTable)
      .where(and(eq(realEstateUnitsTable.tenantId, tenantId), eq(realEstateUnitsTable.id, unitId)))
      .returning();
    if (target?.propertyId) {
      const remaining = await listUnits(tenantId, target.propertyId);
      await updateProperty(tenantId, target.propertyId, { totalUnitsCount: remaining.length });
    }
    return res.length > 0;
  }

  const idx = memoryUnits.findIndex((u) => u.tenantId === tenantId && u.id === unitId);
  if (idx === -1) return false;
  const target = memoryUnits[idx];
  memoryUnits.splice(idx, 1);
  if (target.propertyId) {
    const remaining = memoryUnits.filter((u) => u.tenantId === tenantId && u.propertyId === target.propertyId);
    const pIdx = memoryProperties.findIndex((p) => p.tenantId === tenantId && p.id === target.propertyId);
    if (pIdx !== -1) {
      memoryProperties[pIdx].totalUnitsCount = remaining.length;
    }
  }
  return true;
}

// ── OWNERS ─────────────────────────────────────────────────────────────────

export async function listOwners(tenantId: string): Promise<RealEstateOwnerRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateOwnersTable)
      .where(and(eq(realEstateOwnersTable.tenantId, tenantId), eq(realEstateOwnersTable.status, 'active')));
  }
  return memoryOwners.filter((o) => o.tenantId === tenantId && o.status === 'active');
}

export async function createOwner(data: {
  tenantId: string;
  fullName: string;
  ownerType?: string;
  nationalIdOrCr?: string;
  email?: string;
  phone?: string;
}): Promise<RealEstateOwnerRow> {
  const row: RealEstateOwnerRow = {
    id: genId('own'),
    tenantId: data.tenantId,
    fullName: data.fullName,
    ownerType: data.ownerType || 'INDIVIDUAL',
    nationalIdOrCr: data.nationalIdOrCr || null,
    email: data.email || null,
    phone: data.phone || null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateOwnersTable).values(row);
    return row;
  }
  memoryOwners.push(row);
  return row;
}

export async function associateOwnerWithProperty(data: {
  tenantId: string;
  propertyId: string;
  ownerId: string;
  ownershipPercentage?: string;
  isPrimaryOwner?: boolean;
}): Promise<RealEstatePropertyOwnerRow> {
  const row: RealEstatePropertyOwnerRow = {
    id: genId('po') as any,
    tenantId: data.tenantId,
    propertyId: data.propertyId,
    ownerId: data.ownerId,
    ownershipPercentage: data.ownershipPercentage || '100',
    isPrimaryOwner: data.isPrimaryOwner ?? true,
    createdAt: new Date(),
  };

  if (db) {
    await db.insert(realEstatePropertyOwnersTable).values(row);
    return row;
  }
  memoryPropertyOwners.push(row);
  return row;
}

export async function listPropertyOwners(tenantId: string, propertyId: string) {
  if (db) {
    return await db
      .select()
      .from(realEstatePropertyOwnersTable)
      .where(and(eq(realEstatePropertyOwnersTable.tenantId, tenantId), eq(realEstatePropertyOwnersTable.propertyId, propertyId)));
  }
  return memoryPropertyOwners.filter((po) => po.tenantId === tenantId && po.propertyId === propertyId);
}

// ── DASHBOARD METRICS ──────────────────────────────────────────────────────

export interface RealEstateDashboardMetrics {
  totalPortfolios: number;
  totalProperties: number;
  totalUnits: number;
  availableUnits: number;
  leasedUnits: number;
  reservedUnits: number;
  occupancyRatePercent: number;
  totalOwners: number;
  propertyTypeBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>;
}

export async function getRealEstateDashboardMetrics(tenantId: string): Promise<RealEstateDashboardMetrics> {
  const portfolios = await listPortfolios(tenantId);
  const properties = await listProperties(tenantId);
  const units = await listUnits(tenantId);
  const owners = await listOwners(tenantId);

  const totalUnits = units.length;
  const availableUnits = units.filter((u) => u.status === 'AVAILABLE').length;
  const leasedUnits = units.filter((u) => u.status === 'LEASED').length;
  const reservedUnits = units.filter((u) => u.status === 'RESERVED').length;

  const occupancyRatePercent = totalUnits > 0 ? parseFloat(((leasedUnits / totalUnits) * 100).toFixed(1)) : 0;

  const propertyTypeBreakdown: Record<string, number> = {};
  const cityBreakdown: Record<string, number> = {};

  properties.forEach((p) => {
    propertyTypeBreakdown[p.type] = (propertyTypeBreakdown[p.type] || 0) + 1;
    const city = p.addressCity || 'Unspecified';
    cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
  });

  return {
    totalPortfolios: portfolios.length,
    totalProperties: properties.length,
    totalUnits,
    availableUnits,
    leasedUnits,
    reservedUnits,
    occupancyRatePercent,
    totalOwners: owners.length,
    propertyTypeBreakdown,
    cityBreakdown,
  };
}
