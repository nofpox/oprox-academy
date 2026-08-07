import { describe, it, expect, beforeEach } from 'vitest';
import {
  listPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  listBuildings,
  createBuilding,
  deleteBuilding,
  listFloors,
  createFloor,
  deleteFloor,
  listUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  listOwners,
  createOwner,
  associateOwnerWithProperty,
  listPropertyOwners,
  getRealEstateDashboardMetrics,
} from '../src/lib/realestate/realEstateStore';

describe('OPROX Real Estate Phase 1 — Comprehensive Test Suite', () => {
  const tenantId = 'tenant_re_test_' + Date.now();
  const userId = 'user_re_admin';

  describe('1. Portfolio Management', () => {
    it('creates a new real estate portfolio and lists active portfolios', async () => {
      const portfolio = await createPortfolio({
        tenantId,
        name: 'Riyadh Commercial Assets',
        code: 'FOL-RYD-01',
        description: 'Prime commercial towers in Olaya & Malaz districts.',
        createdBy: userId,
      });

      expect(portfolio.id).toMatch(/^fol_/);
      expect(portfolio.tenantId).toBe(tenantId);
      expect(portfolio.name).toBe('Riyadh Commercial Assets');
      expect(portfolio.status).toBe('active');

      const list = await listPortfolios(tenantId);
      expect(list.some((p) => p.id === portfolio.id)).toBe(true);
    });

    it('retrieves and updates a portfolio', async () => {
      const portfolio = await createPortfolio({
        tenantId,
        name: 'Jeddah Waterfront Portfolio',
        code: 'FOL-JED-01',
        createdBy: userId,
      });

      const fetched = await getPortfolio(tenantId, portfolio.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe('Jeddah Waterfront Portfolio');

      const updated = await updatePortfolio(tenantId, portfolio.id, {
        description: 'Luxury beachfront villas and hospitality units.',
      });
      expect(updated?.description).toBe('Luxury beachfront villas and hospitality units.');
    });

    it('deletes a portfolio', async () => {
      const portfolio = await createPortfolio({
        tenantId,
        name: 'Temporary Portfolio',
        createdBy: userId,
      });

      const deleted = await deletePortfolio(tenantId, portfolio.id);
      expect(deleted).toBe(true);

      const fetched = await getPortfolio(tenantId, portfolio.id);
      expect(fetched).toBeNull();
    });
  });

  describe('2. Property Registry & Saudi Address Support', () => {
    it('creates a property with full Saudi address and specs', async () => {
      const property = await createProperty({
        tenantId,
        name: 'Al Malaz Innovation Plaza',
        type: 'commercial_tower',
        status: 'ACTIVE',
        addressRegion: 'Riyadh Region',
        addressCity: 'Riyadh',
        addressDistrict: 'Al Malaz',
        addressStreet: 'King Abdulaziz Road',
        buildingNumber: '7821',
        additionalNumber: '3210',
        postalCode: '12831',
        latitude: '24.6712',
        longitude: '46.7211',
        totalAreaSqm: '15000',
        builtUpAreaSqm: '28000',
        yearBuilt: 2024,
        createdBy: userId,
      });

      expect(property.id).toMatch(/^prop_/);
      expect(property.addressCity).toBe('Riyadh');
      expect(property.addressDistrict).toBe('Al Malaz');
      expect(property.totalAreaSqm).toBe('15000');
      expect(property.status).toBe('ACTIVE');

      const list = await listProperties(tenantId, { city: 'Riyadh' });
      expect(list.some((p) => p.id === property.id)).toBe(true);
    });

    it('filters properties by portfolio, type, and search query', async () => {
      const portfolio = await createPortfolio({ tenantId, name: 'Filter Test Portfolio', createdBy: userId });

      const p1 = await createProperty({
        tenantId,
        portfolioId: portfolio.id,
        name: 'Al Hamra Tower',
        type: 'commercial_tower',
        addressCity: 'Jeddah',
        createdBy: userId,
      });

      const p2 = await createProperty({
        tenantId,
        portfolioId: portfolio.id,
        name: 'Al Corniche Villas',
        type: 'standalone_villa',
        addressCity: 'Jeddah',
        createdBy: userId,
      });

      const filteredByPort = await listProperties(tenantId, { portfolioId: portfolio.id });
      expect(filteredByPort.length).toBe(2);

      const filteredByType = await listProperties(tenantId, { type: 'standalone_villa' });
      expect(filteredByType.some((p) => p.id === p2.id)).toBe(true);

      const filteredBySearch = await listProperties(tenantId, { search: 'Corniche' });
      expect(filteredBySearch.length).toBe(1);
      expect(filteredBySearch[0].id).toBe(p2.id);
    });
  });

  describe('3. Asset Hierarchy: Buildings, Floors, and Units', () => {
    it('constructs a multi-level building & floor hierarchy', async () => {
      const property = await createProperty({
        tenantId,
        name: 'Olaya Financial Tower',
        type: 'commercial_tower',
        addressCity: 'Riyadh',
        createdBy: userId,
      });

      const bldg = await createBuilding({
        tenantId,
        propertyId: property.id,
        name: 'Tower Alpha',
        code: 'TWR-A',
        totalFloors: 10,
      });

      expect(bldg.id).toMatch(/^bldg_/);
      expect(bldg.propertyId).toBe(property.id);

      const floor = await createFloor({
        tenantId,
        buildingId: bldg.id,
        floorNumber: 5,
        name: '5th Executive Floor',
      });

      expect(floor.id).toMatch(/^flr_/);
      expect(floor.buildingId).toBe(bldg.id);

      const unit = await createUnit({
        tenantId,
        propertyId: property.id,
        buildingId: bldg.id,
        floorId: floor.id,
        unitNumber: '501-A',
        unitType: 'office',
        rentPriceSar: '120000',
        areaSqm: '250',
        status: 'AVAILABLE',
      });

      expect(unit.id).toMatch(/^unit_/);
      expect(unit.unitNumber).toBe('501-A');

      const unitsList = await listUnits(tenantId, property.id);
      expect(unitsList.length).toBe(1);

      const fetchedProp = await getProperty(tenantId, property.id);
      expect(fetchedProp?.totalUnitsCount).toBe(1);
    });
  });

  describe('4. Property Owners Registry', () => {
    it('registers an owner and associates them with a property', async () => {
      const owner = await createOwner({
        tenantId,
        fullName: 'Sheikh Mohammed Al-Otaibi',
        ownerType: 'INDIVIDUAL',
        nationalIdOrCr: '1010987654',
        email: 'alotaibi@example.sa',
        phone: '+966501234567',
      });

      expect(owner.id).toMatch(/^own_/);
      expect(owner.fullName).toBe('Sheikh Mohammed Al-Otaibi');

      const property = await createProperty({
        tenantId,
        name: 'King Road Mall',
        type: 'retail',
        addressCity: 'Jeddah',
        createdBy: userId,
      });

      const assoc = await associateOwnerWithProperty({
        tenantId,
        propertyId: property.id,
        ownerId: owner.id,
        ownershipPercentage: '100',
        isPrimaryOwner: true,
      });

      expect(assoc.propertyId).toBe(property.id);
      expect(assoc.ownerId).toBe(owner.id);

      const propOwners = await listPropertyOwners(tenantId, property.id);
      expect(propOwners.length).toBe(1);
    });
  });

  describe('5. Operational Dashboard Metrics', () => {
    it('calculates accurate occupancy rate and asset breakdown', async () => {
      const dashTenantId = tenantId + '_dash';
      const prop = await createProperty({
        tenantId: dashTenantId,
        name: 'Dashboard Test Property',
        type: 'apartment_building',
        addressCity: 'Dammam',
        createdBy: userId,
      });

      await createUnit({
        tenantId: dashTenantId,
        propertyId: prop.id,
        unitNumber: 'U-101',
        status: 'LEASED',
      });

      await createUnit({
        tenantId: dashTenantId,
        propertyId: prop.id,
        unitNumber: 'U-102',
        status: 'LEASED',
      });

      await createUnit({
        tenantId: dashTenantId,
        propertyId: prop.id,
        unitNumber: 'U-103',
        status: 'AVAILABLE',
      });

      await createUnit({
        tenantId: dashTenantId,
        propertyId: prop.id,
        unitNumber: 'U-104',
        status: 'RESERVED',
      });

      const metrics = await getRealEstateDashboardMetrics(dashTenantId);
      expect(metrics.totalUnits).toBe(4);
      expect(metrics.leasedUnits).toBe(2);
      expect(metrics.availableUnits).toBe(1);
      expect(metrics.reservedUnits).toBe(1);
      expect(metrics.occupancyRatePercent).toBe(50.0);
      expect(metrics.cityBreakdown['Dammam']).toBeGreaterThanOrEqual(1);
    });
  });
});
