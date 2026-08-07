/**
 * OPROX Real Estate Phase 1 — Express REST Router
 * Authoritative REST endpoints for Portfolios, Properties, Asset Hierarchy, Owners, and Operational Dashboard.
 */

import { Router } from 'express';
import { requireAuth, AuthRequest } from './auth';
import { logSecurityAudit } from './audit';
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
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  listLeases,
  getLease,
  createLease,
  transitionLeaseStatus,
  renewLease,
  generateRentSchedules,
  listLeaseSchedules,
  listLeaseCharges,
  createLeaseCharge,
  createPayment,
  listPayments,
  getPayment,
  autoAllocatePayment,
  createSecurityDeposit,
  listSecurityDeposits,
  processSecurityDepositRefund,
  listLeaseEvents,
  uploadLeaseDocument,
  listLeaseDocuments,
  getLeaseFinancialSummary,
  getPhase2DashboardMetrics,
} from '../src/lib/realestate/realEstatePhase2Store';
import {
  createLead,
  getLead,
  listLeads,
  updateLead,
  transitionLeadStatus,
  addLeadActivity,
  listLeadActivities,
  matchPropertiesForLead,
  listLeadPropertyMatches,
  scheduleViewing,
  getViewing,
  listViewings,
  updateViewingStatus,
  createOffer,
  getOffer,
  listOffers,
  updateOfferStatus,
  createReservation,
  getReservation,
  listReservations,
  convertReservationToLease,
  cancelReservation,
  getPhase3CrmMetrics,
} from '../src/lib/realestate/realEstatePhase3Store';
import {
  createDeveloper,
  getDeveloper,
  listDevelopers,
  updateDeveloper,
  deleteDeveloper,
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  createListing,
  getListing,
  incrementListingViewCount,
  searchPublicListings,
  updateListing,
  deleteListing,
  aiSearchPublicListings,
  generateAiValuation,
  saveUserSearch,
  listUserSavedSearches,
  deleteUserSavedSearch,
  toggleFavoriteProperty,
  listUserFavorites,
  createInquiry,
  listInquiries,
  updateInquiryStatus,
  getPhase4MarketplaceMetrics,
} from '../src/lib/realestate/realEstatePhase4Store';
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
  createInvestmentAnalysis,
  getInvestmentAnalysis,
  listInvestmentAnalyses,
  compareInvestments,
  askAiInvestmentAdvisor,
} from '../src/lib/realestate/realEstatePhase5Store';
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

const router = Router();

// ── DASHBOARD ──────────────────────────────────────────────────────────────

router.get('/api/real-estate/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const metrics = await getRealEstateDashboardMetrics(tenantId);
    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch Real Estate dashboard metrics.' });
  }
});

// ── PORTFOLIOS ─────────────────────────────────────────────────────────────

router.get('/api/real-estate/portfolios', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const portfolios = await listPortfolios(tenantId);
    res.json({ success: true, portfolios });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list portfolios.' });
  }
});

router.post('/api/real-estate/portfolios', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { name, code, description } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" is required and must be a string.' });
    }

    const portfolio = await createPortfolio({
      tenantId,
      name,
      code,
      description,
      createdBy: userId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_PORTFOLIO', portfolioId: portfolio.id });
    res.json({ success: true, portfolio });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create portfolio.' });
  }
});

router.get('/api/real-estate/portfolios/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const portfolio = await getPortfolio(tenantId, req.params.id);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found or access denied.' });
    }
    res.json({ success: true, portfolio });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch portfolio.' });
  }
});

router.put('/api/real-estate/portfolios/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const existing = await getPortfolio(tenantId, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Portfolio not found or access denied.' });
    }

    const updated = await updatePortfolio(tenantId, req.params.id, req.body);
    res.json({ success: true, portfolio: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update portfolio.' });
  }
});

router.delete('/api/real-estate/portfolios/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deletePortfolio(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Portfolio not found or access denied.' });
    }
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DELETE_RE_PORTFOLIO', portfolioId: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete portfolio.' });
  }
});

// ── PROPERTIES ─────────────────────────────────────────────────────────────

router.get('/api/real-estate/properties', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { portfolioId, type, status, city, search } = req.query;

    const properties = await listProperties(tenantId, {
      portfolioId: portfolioId as string,
      type: type as string,
      status: status as string,
      city: city as string,
      search: search as string,
    });

    res.json({ success: true, properties });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list properties.' });
  }
});

router.post('/api/real-estate/properties', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const {
      name,
      type,
      portfolioId,
      status,
      description,
      addressRegion,
      addressCity,
      addressDistrict,
      addressStreet,
      postalCode,
      buildingNumber,
      additionalNumber,
      latitude,
      longitude,
      totalAreaSqm,
      builtUpAreaSqm,
      yearBuilt,
    } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" is required and must be a string.' });
    }
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Field "type" is required and must be a string.' });
    }

    const property = await createProperty({
      tenantId,
      portfolioId,
      name,
      type,
      status,
      description,
      addressRegion,
      addressCity,
      addressDistrict,
      addressStreet,
      postalCode,
      buildingNumber,
      additionalNumber,
      latitude: latitude ? String(latitude) : undefined,
      longitude: longitude ? String(longitude) : undefined,
      totalAreaSqm: totalAreaSqm ? String(totalAreaSqm) : undefined,
      builtUpAreaSqm: builtUpAreaSqm ? String(builtUpAreaSqm) : undefined,
      yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
      createdBy: userId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_PROPERTY', propertyId: property.id });
    res.json({ success: true, property });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create property.' });
  }
});

router.get('/api/real-estate/properties/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const property = await getProperty(tenantId, req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied.' });
    }
    res.json({ success: true, property });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch property.' });
  }
});

router.put('/api/real-estate/properties/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const existing = await getProperty(tenantId, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Property not found or access denied.' });
    }

    const updated = await updateProperty(tenantId, req.params.id, req.body);
    res.json({ success: true, property: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update property.' });
  }
});

router.delete('/api/real-estate/properties/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteProperty(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Property not found or access denied.' });
    }
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DELETE_RE_PROPERTY', propertyId: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete property.' });
  }
});

// ── BUILDINGS & FLOORS ─────────────────────────────────────────────────────

router.get('/api/real-estate/properties/:propertyId/buildings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const buildings = await listBuildings(tenantId, req.params.propertyId);
    res.json({ success: true, buildings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list buildings.' });
  }
});

router.post('/api/real-estate/properties/:propertyId/buildings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const property = await getProperty(tenantId, req.params.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Parent property not found or access denied.' });
    }

    const { name, code, totalFloors } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" is required.' });
    }

    const building = await createBuilding({
      tenantId,
      propertyId: req.params.propertyId,
      name,
      code,
      totalFloors: totalFloors ? Number(totalFloors) : 1,
    });

    res.json({ success: true, building });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create building.' });
  }
});

router.delete('/api/real-estate/buildings/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteBuilding(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Building not found or access denied.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete building.' });
  }
});

router.get('/api/real-estate/buildings/:buildingId/floors', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const floors = await listFloors(tenantId, req.params.buildingId);
    res.json({ success: true, floors });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list floors.' });
  }
});

router.post('/api/real-estate/buildings/:buildingId/floors', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { floorNumber, name } = req.body;

    if (floorNumber === undefined || !name) {
      return res.status(400).json({ error: 'Fields "floorNumber" and "name" are required.' });
    }

    const floor = await createFloor({
      tenantId,
      buildingId: req.params.buildingId,
      floorNumber: Number(floorNumber),
      name: String(name),
    });

    res.json({ success: true, floor });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create floor.' });
  }
});

router.delete('/api/real-estate/floors/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteFloor(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Floor not found or access denied.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete floor.' });
  }
});

// ── UNITS ──────────────────────────────────────────────────────────────────

router.get('/api/real-estate/units', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { propertyId } = req.query;
    const units = await listUnits(tenantId, propertyId as string);
    res.json({ success: true, units });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list units.' });
  }
});

router.post('/api/real-estate/units', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const {
      propertyId,
      buildingId,
      floorId,
      unitNumber,
      unitType,
      status,
      areaSqm,
      bedrooms,
      bathrooms,
      rentPriceSar,
      salePriceSar,
      description,
    } = req.body;

    if (!propertyId || !unitNumber) {
      return res.status(400).json({ error: 'Fields "propertyId" and "unitNumber" are required.' });
    }

    const unit = await createUnit({
      tenantId,
      propertyId,
      buildingId,
      floorId,
      unitNumber,
      unitType,
      status,
      areaSqm: areaSqm ? String(areaSqm) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      rentPriceSar: rentPriceSar ? String(rentPriceSar) : undefined,
      salePriceSar: salePriceSar ? String(salePriceSar) : undefined,
      description,
    });

    res.json({ success: true, unit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create unit.' });
  }
});

router.get('/api/real-estate/units/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const unit = await getUnit(tenantId, req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found or access denied.' });
    }
    res.json({ success: true, unit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch unit.' });
  }
});

router.put('/api/real-estate/units/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const existing = await getUnit(tenantId, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Unit not found or access denied.' });
    }

    const updated = await updateUnit(tenantId, req.params.id, req.body);
    res.json({ success: true, unit: updated });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update unit.' });
  }
});

router.delete('/api/real-estate/units/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteUnit(tenantId, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Unit not found or access denied.' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete unit.' });
  }
});

// ── OWNERS ─────────────────────────────────────────────────────────────────

router.get('/api/real-estate/owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const owners = await listOwners(tenantId);
    res.json({ success: true, owners });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list owners.' });
  }
});

router.post('/api/real-estate/owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { fullName, ownerType, nationalIdOrCr, email, phone } = req.body;

    if (!fullName || typeof fullName !== 'string') {
      return res.status(400).json({ error: 'Field "fullName" is required.' });
    }

    const owner = await createOwner({
      tenantId,
      fullName,
      ownerType,
      nationalIdOrCr,
      email,
      phone,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_OWNER', ownerId: owner.id });
    res.json({ success: true, owner });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create owner.' });
  }
});

router.post('/api/real-estate/property-owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { propertyId, ownerId, ownershipPercentage, isPrimaryOwner } = req.body;

    if (!propertyId || !ownerId) {
      return res.status(400).json({ error: 'Fields "propertyId" and "ownerId" are required.' });
    }

    const association = await associateOwnerWithProperty({
      tenantId,
      propertyId,
      ownerId,
      ownershipPercentage: ownershipPercentage ? String(ownershipPercentage) : '100',
      isPrimaryOwner,
    });

    res.json({ success: true, association });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to link property owner.' });
  }
});

router.get('/api/real-estate/properties/:propertyId/owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const owners = await listPropertyOwners(tenantId, req.params.propertyId);
    res.json({ success: true, owners });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list property owners.' });
  }
});

// ── PHASE 2: CONTACTS ──────────────────────────────────────────────────────

router.get('/api/real-estate/contacts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const contacts = await listContacts(tenantId);
    res.json({ success: true, contacts });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list contacts.' });
  }
});

router.post('/api/real-estate/contacts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const contact = await createContact({ ...req.body, tenantId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_CONTACT', contactId: contact.id });
    res.json({ success: true, contact });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create contact.' });
  }
});

router.get('/api/real-estate/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const contact = await getContact(tenantId, req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ success: true, contact });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch contact.' });
  }
});

router.put('/api/real-estate/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const contact = await updateContact(tenantId, req.params.id, req.body);
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ success: true, contact });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update contact.' });
  }
});

router.delete('/api/real-estate/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const deleted = await deleteContact(tenantId, req.params.id);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete contact.' });
  }
});

// ── PHASE 2: TENANTS ───────────────────────────────────────────────────────

router.get('/api/real-estate/tenants', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const tenants = await listTenants(tenantId);
    res.json({ success: true, tenants });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list real estate tenants.' });
  }
});

router.post('/api/real-estate/tenants', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const tenantRecord = await createTenant({ ...req.body, tenantId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_TENANT', tenantRecordId: tenantRecord.id });
    res.json({ success: true, tenant: tenantRecord });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create real estate tenant.' });
  }
});

router.get('/api/real-estate/tenants/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const tenantRecord = await getTenant(tenantId, req.params.id);
    if (!tenantRecord) return res.status(404).json({ error: 'Tenant record not found.' });
    res.json({ success: true, tenant: tenantRecord });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch tenant.' });
  }
});

router.put('/api/real-estate/tenants/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const tenantRecord = await updateTenant(tenantId, req.params.id, req.body);
    if (!tenantRecord) return res.status(404).json({ error: 'Tenant record not found.' });
    res.json({ success: true, tenant: tenantRecord });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update tenant.' });
  }
});

// ── PHASE 2: LEASES ────────────────────────────────────────────────────────

router.get('/api/real-estate/leases', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { propertyId, reTenantId, status } = req.query;
    const leases = await listLeases(tenantId, {
      propertyId: propertyId ? String(propertyId) : undefined,
      reTenantId: reTenantId ? String(reTenantId) : undefined,
      status: status ? String(status) : undefined,
    });
    res.json({ success: true, leases });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list leases.' });
  }
});

router.post('/api/real-estate/leases', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const lease = await createLease({ ...req.body, tenantId, createdBy: userId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_LEASE', leaseId: lease.id });
    res.json({ success: true, lease });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create lease.' });
  }
});

router.get('/api/real-estate/leases/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const lease = await getLease(tenantId, req.params.id);
    if (!lease) return res.status(404).json({ error: 'Lease not found.' });
    res.json({ success: true, lease });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch lease.' });
  }
});

router.put('/api/real-estate/leases/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { status, notes, terminationReason } = req.body;

    if (!status) return res.status(400).json({ error: 'Field "status" is required.' });

    const lease = await transitionLeaseStatus(tenantId, req.params.id, status, userId, {
      notes,
      terminationReason,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'TRANSITION_RE_LEASE', leaseId: lease.id, status });
    res.json({ success: true, lease });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Lease status transition failed.' });
  }
});

router.post('/api/real-estate/leases/:id/renew', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { startDate, endDate, contractValueSar, paymentFrequency } = req.body;

    const childLease = await renewLease(tenantId, req.params.id, {
      startDate,
      endDate,
      contractValueSar,
      paymentFrequency,
      actorId: userId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'RENEW_RE_LEASE', parentLeaseId: req.params.id, childLeaseId: childLease.id });
    res.json({ success: true, lease: childLease });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to renew lease.' });
  }
});

router.post('/api/real-estate/leases/:id/schedules/generate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const schedules = await generateRentSchedules(tenantId, req.params.id);
    res.json({ success: true, schedules });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate rent schedules.' });
  }
});

router.get('/api/real-estate/leases/:id/schedules', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const schedules = await listLeaseSchedules(tenantId, req.params.id);
    res.json({ success: true, schedules });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lease schedules.' });
  }
});

router.get('/api/real-estate/leases/:id/charges', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const charges = await listLeaseCharges(tenantId, req.params.id);
    res.json({ success: true, charges });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lease charges.' });
  }
});

router.post('/api/real-estate/leases/:id/charges', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const charge = await createLeaseCharge({ ...req.body, tenantId, leaseId: req.params.id });
    res.json({ success: true, charge });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create lease charge.' });
  }
});

router.get('/api/real-estate/leases/:id/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const events = await listLeaseEvents(tenantId, req.params.id);
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lease events.' });
  }
});

router.get('/api/real-estate/leases/:id/documents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const documents = await listLeaseDocuments(tenantId, req.params.id);
    res.json({ success: true, documents });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lease documents.' });
  }
});

router.post('/api/real-estate/leases/:id/documents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const document = await uploadLeaseDocument({ ...req.body, tenantId, leaseId: req.params.id, uploadedBy: userId });
    res.json({ success: true, document });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to upload lease document.' });
  }
});

router.get('/api/real-estate/leases/:id/financials', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const summary = await getLeaseFinancialSummary(tenantId, req.params.id);
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch lease financial summary.' });
  }
});

// ── PHASE 2: PAYMENTS ──────────────────────────────────────────────────────

router.get('/api/real-estate/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { leaseId } = req.query;
    const payments = await listPayments(tenantId, leaseId ? String(leaseId) : undefined);
    res.json({ success: true, payments });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list payments.' });
  }
});

router.post('/api/real-estate/payments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const payment = await createPayment({ ...req.body, tenantId, createdBy: userId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_PAYMENT', paymentId: payment.id });
    res.json({ success: true, payment });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to record payment.' });
  }
});

router.get('/api/real-estate/payments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const payment = await getPayment(tenantId, req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    res.json({ success: true, payment });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch payment.' });
  }
});

router.post('/api/real-estate/payments/:id/allocate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { leaseId } = req.body;
    if (!leaseId) return res.status(400).json({ error: 'Field "leaseId" is required.' });
    const allocatedAmount = await autoAllocatePayment(tenantId, req.params.id, leaseId);
    res.json({ success: true, allocatedAmount });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to allocate payment.' });
  }
});

// ── PHASE 2: SECURITY DEPOSITS ──────────────────────────────────────────────

router.get('/api/real-estate/security-deposits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { leaseId } = req.query;
    const deposits = await listSecurityDeposits(tenantId, leaseId ? String(leaseId) : undefined);
    res.json({ success: true, deposits });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list security deposits.' });
  }
});

router.post('/api/real-estate/security-deposits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const deposit = await createSecurityDeposit({ ...req.body, tenantId });
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create security deposit.' });
  }
});

router.post('/api/real-estate/security-deposits/:id/refund', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { deductionsSar, notes } = req.body;
    const deposit = await processSecurityDepositRefund(tenantId, req.params.id, Number(deductionsSar || 0), notes);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'REFUND_RE_SECURITY_DEPOSIT', depositId: deposit.id });
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to process deposit refund.' });
  }
});

// ── PHASE 2 DASHBOARD METRICS ──────────────────────────────────────────────

router.get('/api/real-estate/phase2-dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const metrics = await getPhase2DashboardMetrics(tenantId);
    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch Phase 2 dashboard metrics.' });
  }
});

// ── PHASE 3: CRM, LEADS & PIPELINE ────────────────────────────────────────

router.get('/api/real-estate/leads', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { status, source, priority, search } = req.query;
    const leads = await listLeads(tenantId, {
      status: status ? String(status) : undefined,
      source: source ? String(source) : undefined,
      priority: priority ? String(priority) : undefined,
      search: search ? String(search) : undefined,
    });
    res.json({ success: true, leads });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list leads.' });
  }
});

router.post('/api/real-estate/leads', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const lead = await createLead({ ...req.body, tenantId, assignedAgentId: req.user!.id });
    res.json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create lead.' });
  }
});

router.get('/api/real-estate/leads/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const lead = await getLead(tenantId, req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    res.json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch lead.' });
  }
});

router.patch('/api/real-estate/leads/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const lead = await updateLead(tenantId, req.params.id, req.body);
    res.json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update lead.' });
  }
});

router.post('/api/real-estate/leads/:id/transition', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { newStatus, reason } = req.body;
    if (!newStatus) return res.status(400).json({ error: 'Field "newStatus" is required.' });
    const lead = await transitionLeadStatus(tenantId, req.params.id, newStatus, req.user!.id, reason);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'TRANSITION_RE_LEAD_STAGE', leadId: lead.id, newStatus });
    res.json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to transition lead stage.' });
  }
});

router.get('/api/real-estate/leads/:id/activities', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const activities = await listLeadActivities(tenantId, req.params.id);
    res.json({ success: true, activities });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lead activities.' });
  }
});

router.post('/api/real-estate/leads/:id/activities', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { activityType, summary, details } = req.body;
    if (!activityType || !summary) return res.status(400).json({ error: 'Fields activityType and summary are required.' });
    const activity = await addLeadActivity({
      tenantId,
      leadId: req.params.id,
      activityType,
      summary,
      details,
      actorId: req.user!.id,
    });
    res.json({ success: true, activity });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to add lead activity.' });
  }
});

router.post('/api/real-estate/leads/:id/match-properties', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const matches = await matchPropertiesForLead(tenantId, req.params.id);
    res.json({ success: true, matches });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to match properties for lead.' });
  }
});

router.get('/api/real-estate/leads/:id/property-matches', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const matches = await listLeadPropertyMatches(tenantId, req.params.id);
    res.json({ success: true, matches });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list lead property matches.' });
  }
});

// ── PHASE 3: VIEWINGS ──────────────────────────────────────────────────────

router.get('/api/real-estate/viewings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { leadId, status, agentId } = req.query;
    const viewings = await listViewings(tenantId, {
      leadId: leadId ? String(leadId) : undefined,
      status: status ? String(status) : undefined,
      agentId: agentId ? String(agentId) : undefined,
    });
    res.json({ success: true, viewings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list viewings.' });
  }
});

router.post('/api/real-estate/viewings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const viewing = await scheduleViewing({ ...req.body, tenantId, assignedAgentId: req.user!.id });
    res.json({ success: true, viewing });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to schedule viewing.' });
  }
});

router.patch('/api/real-estate/viewings/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { status, feedback, agentRating, clientInterestLevel } = req.body;
    if (!status) return res.status(400).json({ error: 'Field "status" is required.' });
    const viewing = await updateViewingStatus(
      tenantId,
      req.params.id,
      status,
      feedback,
      agentRating ? Number(agentRating) : undefined,
      clientInterestLevel
    );
    res.json({ success: true, viewing });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update viewing status.' });
  }
});

// ── PHASE 3: OFFERS ────────────────────────────────────────────────────────

router.get('/api/real-estate/offers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { leadId, status } = req.query;
    const offers = await listOffers(tenantId, {
      leadId: leadId ? String(leadId) : undefined,
      status: status ? String(status) : undefined,
    });
    res.json({ success: true, offers });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list offers.' });
  }
});

router.post('/api/real-estate/offers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const offer = await createOffer({ ...req.body, tenantId, createdBy: req.user!.id });
    res.json({ success: true, offer });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create offer.' });
  }
});

router.patch('/api/real-estate/offers/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { status, counterAmountSar, specialTerms } = req.body;
    if (!status) return res.status(400).json({ error: 'Field "status" is required.' });
    const offer = await updateOfferStatus(tenantId, req.params.id, status, counterAmountSar, specialTerms, req.user!.id);
    res.json({ success: true, offer });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update offer status.' });
  }
});

// ── PHASE 3: RESERVATIONS & LEASE CONVERSION ─────────────────────────────

router.get('/api/real-estate/reservations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { status, unitId } = req.query;
    const reservations = await listReservations(tenantId, {
      status: status ? String(status) : undefined,
      unitId: unitId ? String(unitId) : undefined,
    });
    res.json({ success: true, reservations });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list reservations.' });
  }
});

router.post('/api/real-estate/reservations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const reservation = await createReservation({ ...req.body, tenantId, createdBy: req.user!.id });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_RESERVATION', reservationId: reservation.id });
    res.json({ success: true, reservation });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create reservation.' });
  }
});

router.post('/api/real-estate/reservations/:id/convert-to-lease', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const result = await convertReservationToLease(tenantId, req.params.id, req.body, req.user!.id);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CONVERT_RE_RESERVATION_TO_LEASE', reservationId: req.params.id, leaseId: result.lease.id });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to convert reservation to lease.' });
  }
});

router.post('/api/real-estate/reservations/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { reason } = req.body;
    const reservation = await cancelReservation(tenantId, req.params.id, reason);
    res.json({ success: true, reservation });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to cancel reservation.' });
  }
});

// ── PHASE 3: CRM DASHBOARD METRICS ────────────────────────────────────────

router.get('/api/real-estate/crm-dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const metrics = await getPhase3CrmMetrics(tenantId);
    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch CRM dashboard metrics.' });
  }
});

// ── PHASE 4: PUBLIC MARKETPLACE & SMART DISCOVERY ────────────────────────

router.get('/api/real-estate/marketplace/listings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const {
      search,
      city,
      district,
      listingType,
      category,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      minArea,
      maxArea,
      furnished,
      completionStatus,
      developerId,
      projectId,
      featured,
      status,
    } = req.query;

    const listings = await searchPublicListings(tenantId, {
      search: search ? String(search) : undefined,
      city: city ? String(city) : undefined,
      district: district ? String(district) : undefined,
      listingType: listingType ? String(listingType) : undefined,
      category: category ? String(category) : undefined,
      propertyType: propertyType ? String(propertyType) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      minArea: minArea ? Number(minArea) : undefined,
      maxArea: maxArea ? Number(maxArea) : undefined,
      furnished: furnished ? String(furnished) : undefined,
      completionStatus: completionStatus ? String(completionStatus) : undefined,
      developerId: developerId ? String(developerId) : undefined,
      projectId: projectId ? String(projectId) : undefined,
      featured: featured !== undefined ? featured === 'true' : undefined,
      status: status ? String(status) : undefined,
    });

    res.json({ success: true, listings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch marketplace listings.' });
  }
});

router.get('/api/real-estate/marketplace/listings/:idOrSlug', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const listing = await getListing(tenantId, req.params.idOrSlug);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    await incrementListingViewCount(tenantId, listing.id);
    res.json({ success: true, listing });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch listing detail.' });
  }
});

router.post('/api/real-estate/marketplace/listings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const listing = await createListing({ ...req.body, tenantId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_LISTING', listingId: listing.id });
    res.json({ success: true, listing });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create marketplace listing.' });
  }
});

router.put('/api/real-estate/marketplace/listings/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const listing = await updateListing(tenantId, req.params.id, req.body);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    res.json({ success: true, listing });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update marketplace listing.' });
  }
});

router.delete('/api/real-estate/marketplace/listings/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteListing(tenantId, req.params.id);
    if (!success) return res.status(404).json({ error: 'Listing not found.' });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DELETE_RE_LISTING', listingId: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete marketplace listing.' });
  }
});

router.post('/api/real-estate/marketplace/search/natural-language', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Field "prompt" is required.' });

    const result = await aiSearchPublicListings(tenantId, prompt);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to execute natural language search.' });
  }
});

router.post('/api/real-estate/marketplace/valuation', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { city, district, propertyType, areaSqm, bedrooms } = req.body;
    if (!city || !district || !propertyType || !areaSqm) {
      return res.status(400).json({ error: 'Fields "city", "district", "propertyType", and "areaSqm" are required.' });
    }

    const valuation = await generateAiValuation({
      tenantId,
      userId: req.user!.id,
      city,
      district,
      propertyType,
      areaSqm: Number(areaSqm),
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
    });

    res.json({ success: true, valuation });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate AI valuation.' });
  }
});

// ── SAVED SEARCHES & FAVORITES ─────────────────────────────────────────────

router.get('/api/real-estate/marketplace/saved-searches', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const savedSearches = await listUserSavedSearches(tenantId, req.user!.id);
    res.json({ success: true, savedSearches });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list saved searches.' });
  }
});

router.post('/api/real-estate/marketplace/saved-searches', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { title, filtersJson, notifyEmail } = req.body;
    if (!title || !filtersJson) {
      return res.status(400).json({ error: 'Fields "title" and "filtersJson" are required.' });
    }

    const savedSearch = await saveUserSearch({
      tenantId,
      userId: req.user!.id,
      title,
      filtersJson,
      notifyEmail,
    });

    res.json({ success: true, savedSearch });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save search.' });
  }
});

router.delete('/api/real-estate/marketplace/saved-searches/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const success = await deleteUserSavedSearch(tenantId, req.params.id);
    if (!success) return res.status(404).json({ error: 'Saved search not found.' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete saved search.' });
  }
});

router.get('/api/real-estate/marketplace/favorites', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const favorites = await listUserFavorites(tenantId, req.user!.id);
    res.json({ success: true, favorites });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch user favorites.' });
  }
});

router.post('/api/real-estate/marketplace/favorites/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: 'Field "listingId" is required.' });

    const result = await toggleFavoriteProperty(tenantId, req.user!.id, listingId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to toggle favorite.' });
  }
});

// ── DEVELOPERS & PROJECTS ───────────────────────────────────────────────────

router.get('/api/real-estate/developers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const developers = await listDevelopers(tenantId);
    res.json({ success: true, developers });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list developers.' });
  }
});

router.get('/api/real-estate/developers/:idOrSlug', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const developer = await getDeveloper(tenantId, req.params.idOrSlug);
    if (!developer) return res.status(404).json({ error: 'Developer profile not found.' });
    res.json({ success: true, developer });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch developer.' });
  }
});

router.post('/api/real-estate/developers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const developer = await createDeveloper({ ...req.body, tenantId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_DEVELOPER', developerId: developer.id });
    res.json({ success: true, developer });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create developer profile.' });
  }
});

router.get('/api/real-estate/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { developerId, city, completionStatus, featured } = req.query;
    const projects = await listProjects(tenantId, {
      developerId: developerId ? String(developerId) : undefined,
      city: city ? String(city) : undefined,
      completionStatus: completionStatus ? String(completionStatus) : undefined,
      featured: featured !== undefined ? featured === 'true' : undefined,
    });
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list projects.' });
  }
});

router.get('/api/real-estate/projects/:idOrSlug', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const project = await getProject(tenantId, req.params.idOrSlug);
    if (!project) return res.status(404).json({ error: 'Project showcase not found.' });
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch project.' });
  }
});

router.post('/api/real-estate/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const project = await createProject({ ...req.body, tenantId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_RE_PROJECT', projectId: project.id });
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create project.' });
  }
});

// ── INQUIRIES & MARKETPLACE METRICS ─────────────────────────────────────────

router.get('/api/real-estate/marketplace/inquiries', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const inquiries = await listInquiries(tenantId);
    res.json({ success: true, inquiries });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list marketplace inquiries.' });
  }
});

router.post('/api/real-estate/marketplace/inquiries', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const inquiry = await createInquiry({ ...req.body, tenantId });
    res.json({ success: true, inquiry });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to submit marketplace inquiry.' });
  }
});

router.patch('/api/real-estate/marketplace/inquiries/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Field "status" is required.' });

    const inquiry = await updateInquiryStatus(tenantId, req.params.id, status);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });
    res.json({ success: true, inquiry });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update inquiry status.' });
  }
});

router.get('/api/real-estate/marketplace/metrics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const metrics = await getPhase4MarketplaceMetrics(tenantId);
    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch marketplace metrics.' });
  }
});

// ── PHASE 5: DESIGN PROJECTS & CONCEPTS WORKSPACE ─────────────────────────

router.get('/api/real-estate/design-projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projects = await listDesignProjects(tenantId, {
      userId: req.query.userId as string,
      projectType: req.query.projectType as string,
      propertyId: req.query.propertyId as string,
      status: req.query.status as string,
    });
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list design projects.' });
  }
});

router.post('/api/real-estate/design-projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const project = await createDesignProject({ ...req.body, tenantId, userId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_DESIGN_PROJECT', projectId: project.id });
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create design project.' });
  }
});

router.get('/api/real-estate/design-projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const project = await getDesignProject(tenantId, req.params.id);
    if (!project) return res.status(404).json({ error: 'Design project not found.' });
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch design project.' });
  }
});

router.put('/api/real-estate/design-projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const project = await updateDesignProject(tenantId, req.params.id, req.body);
    if (!project) return res.status(404).json({ error: 'Design project not found.' });
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update design project.' });
  }
});

router.delete('/api/real-estate/design-projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const deleted = await deleteDesignProject(tenantId, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Design project not found.' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete design project.' });
  }
});

// Concepts
router.get('/api/real-estate/design-projects/:id/concepts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const concepts = await listDesignConcepts(tenantId, req.params.id);
    res.json({ success: true, concepts });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list design concepts.' });
  }
});

router.post('/api/real-estate/design-concepts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const concept = await createDesignConcept({ ...req.body, tenantId });
    res.json({ success: true, concept });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create design concept.' });
  }
});

router.get('/api/real-estate/design-concepts/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const concept = await getDesignConcept(tenantId, req.params.id);
    if (!concept) return res.status(404).json({ error: 'Design concept not found.' });
    res.json({ success: true, concept });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch design concept.' });
  }
});

router.put('/api/real-estate/design-concepts/:id/approval', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Field "status" is required.' });

    const concept = await updateConceptApproval(tenantId, req.params.id, status);
    if (!concept) return res.status(404).json({ error: 'Design concept not found.' });
    res.json({ success: true, concept });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update concept approval.' });
  }
});

// Studio Export Integration Boundary
router.post('/api/real-estate/design-projects/:id/export-studio', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const result = await exportDesignProjectToStudio(tenantId, req.params.id);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to export design project to OPROX Studio.' });
  }
});

// ── PHASE 5: AI GENERATOR SERVICES ────────────────────────────────────────

router.post('/api/real-estate/ai/architect', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const result = await generateAiArchitectConcept({ ...req.body, tenantId, userId });
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'AI_ARCHITECT_GENERATE', projectId: result.project.id });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate AI architectural concept.' });
  }
});

router.post('/api/real-estate/ai/interior', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const result = await generateAiInteriorConcept({ ...req.body, tenantId, userId });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate AI interior concept.' });
  }
});

router.post('/api/real-estate/ai/exterior', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const result = await generateAiExteriorConcept({ ...req.body, tenantId, userId });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate AI exterior concept.' });
  }
});

router.post('/api/real-estate/ai/renovation', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const result = await generateAiRenovationConcept({ ...req.body, tenantId, userId });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to generate AI renovation roadmap.' });
  }
});

// ── PHASE 5: INVESTMENT INTELLIGENCE ──────────────────────────────────────

router.get('/api/real-estate/investment-analyses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const analyses = await listInvestmentAnalyses(tenantId, {
      userId: req.query.userId as string,
      propertyId: req.query.propertyId as string,
    });
    res.json({ success: true, analyses });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list investment analyses.' });
  }
});

router.post('/api/real-estate/investment-analyses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const analysis = await createInvestmentAnalysis({ ...req.body, tenantId, userId });
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create investment analysis.' });
  }
});

router.get('/api/real-estate/investment-analyses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const analysis = await getInvestmentAnalysis(tenantId, req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Investment analysis not found.' });
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch investment analysis.' });
  }
});

router.post('/api/real-estate/investment-compare', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { analysisIds } = req.body;
    if (!Array.isArray(analysisIds) || analysisIds.length === 0) {
      return res.status(400).json({ error: 'Field "analysisIds" must be a non-empty array of strings.' });
    }

    const result = await compareInvestments(tenantId, analysisIds);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to compare investment analyses.' });
  }
});

router.post('/api/real-estate/ai/investment-advisor', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { prompt, analysisIds } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Field "prompt" is required.' });

    const result = await askAiInvestmentAdvisor({ tenantId, userId, prompt, analysisIds });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to query AI Investment Advisor.' });
  }
});

// ── PHASE 6 — IMMERSIVE 3D / VR / AR / DIGITAL TWIN ───────────────────────

router.get('/api/real-estate/phase6/assets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const assets = await listImmersiveAssets(tenantId, {
      linkedEntityType: req.query.linkedEntityType as string,
      linkedEntityId: req.query.linkedEntityId as string,
      assetType: req.query.assetType as string,
    });
    res.json({ success: true, assets });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list immersive assets.' });
  }
});

router.post('/api/real-estate/phase6/assets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { linkedEntityType, linkedEntityId, assetType, title, storageReference, mimeType, fileSizeBytes, isPublicAvailable, metadataJson } = req.body;
    if (!linkedEntityType || !linkedEntityId || !assetType || !title || !storageReference) {
      return res.status(400).json({ error: 'Missing required fields: linkedEntityType, linkedEntityId, assetType, title, storageReference.' });
    }

    const asset = await createImmersiveAsset({
      tenantId,
      linkedEntityType,
      linkedEntityId,
      assetType,
      title,
      storageReference,
      mimeType,
      fileSizeBytes,
      isPublicAvailable,
      metadataJson,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'IMMERSIVE_ASSET_CREATED', assetId: asset.id, assetType, linkedEntityId });

    res.json({ success: true, asset });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create immersive asset.' });
  }
});

router.get('/api/real-estate/phase6/assets/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const asset = await getImmersiveAsset(tenantId, req.params.id);
    if (!asset) return res.status(404).json({ error: 'Immersive asset not found or access denied.' });
    res.json({ success: true, asset });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch immersive asset.' });
  }
});

router.delete('/api/real-estate/phase6/assets/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const ok = await deleteImmersiveAsset(tenantId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Asset not found or access denied.' });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'IMMERSIVE_ASSET_DELETED', assetId: req.params.id });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete immersive asset.' });
  }
});

router.get('/api/real-estate/phase6/digital-twins', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const twins = await listDigitalTwins(tenantId, {
      linkedEntityType: req.query.linkedEntityType as string,
      linkedEntityId: req.query.linkedEntityId as string,
      onlyCurrentVersion: req.query.allVersions === 'true' ? false : true,
    });
    res.json({ success: true, digitalTwins: twins });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list Digital Twins.' });
  }
});

router.post('/api/real-estate/phase6/digital-twins', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { title, linkedEntityType, linkedEntityId, spatialMetadataJson, primaryModelAssetId, floorsCount, designProjectId, designConceptId } = req.body;
    if (!title || !linkedEntityType || !linkedEntityId || !spatialMetadataJson) {
      return res.status(400).json({ error: 'Missing required fields: title, linkedEntityType, linkedEntityId, spatialMetadataJson.' });
    }

    const dt = await createDigitalTwin({
      tenantId,
      title,
      linkedEntityType,
      linkedEntityId,
      spatialMetadataJson,
      primaryModelAssetId,
      floorsCount,
      designProjectId,
      designConceptId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DIGITAL_TWIN_CREATED', digitalTwinId: dt.id, linkedEntityId });

    res.json({ success: true, digitalTwin: dt });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create Digital Twin.' });
  }
});

router.get('/api/real-estate/phase6/digital-twins/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const dt = await getDigitalTwin(tenantId, req.params.id);
    if (!dt) return res.status(404).json({ error: 'Digital Twin not found or access denied.' });
    res.json({ success: true, digitalTwin: dt });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch Digital Twin.' });
  }
});

router.post('/api/real-estate/phase6/digital-twins/:id/version', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const updatedDt = await createDigitalTwinVersion(tenantId, req.params.id, req.body);
    res.json({ success: true, digitalTwin: updatedDt });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create Digital Twin version.' });
  }
});

router.post('/api/real-estate/phase6/capability-check', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { sessionType, entityId } = req.body;
    if (!sessionType) return res.status(400).json({ error: 'Field "sessionType" is required.' });

    const userAgent = (req.headers['user-agent'] as string) || '';
    const capabilityState = await detectVRARCapability(sessionType, userAgent);
    await logCapabilityCheck(tenantId, userId, sessionType, capabilityState, userAgent, entityId);

    res.json({ success: true, sessionType, capabilityState, userAgent });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to check capability.' });
  }
});

router.post('/api/real-estate/phase6/design-handoff', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { designProjectId, conceptId } = req.body;
    if (!designProjectId || !conceptId) {
      return res.status(400).json({ error: 'Fields "designProjectId" and "conceptId" are required.' });
    }

    const result = await handoffDesignToImmersive(tenantId, userId, designProjectId, conceptId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed design to immersive handoff.' });
  }
});

router.get('/api/real-estate/phase6/marketplace-assets/:entityType/:entityId', async (req, res) => {
  try {
    const tenantId = (req.query.tenantId as string) || 'tenant_default';
    const { entityType, entityId } = req.params;
    const data = await getMarketplaceImmersiveAssets(tenantId, entityType as any, entityId);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch marketplace immersive assets.' });
  }
});

router.get('/api/real-estate/phase6/boundary-audit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const audit = auditProductBoundaryScope();
    res.json({ success: true, audit });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to run boundary audit.' });
  }
});

export default router;
