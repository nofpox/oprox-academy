import { describe, it, expect, beforeAll } from 'vitest';
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

describe('OPROX Real Estate — Phase 4: Public PropTech Marketplace & Smart Discovery', () => {
  const tenant1 = 'tenant_p4_test_org1';
  const tenant2 = 'tenant_p4_test_org2';
  const user1 = 'user_buyer_001';

  let dev1Id: string;
  let prj1Id: string;
  let lst1Id: string;
  let lst2Id: string;

  beforeAll(async () => {
    // 1. Create Developer Company
    const dev = await createDeveloper({
      tenantId: tenant1,
      name: 'Roshn Real Estate',
      headquartersCity: 'Riyadh',
      verified: true,
      rating: 4.9,
    });
    dev1Id = dev.id;

    // 2. Create Master Project
    const prj = await createProject({
      tenantId: tenant1,
      developerId: dev1Id,
      title: 'Sedra Master Development',
      city: 'Riyadh',
      district: 'An Narjis',
      completionStatus: 'UNDER_CONSTRUCTION',
      startingPriceSar: '950000',
      constructionProgressPct: 70,
      featured: true,
    });
    prj1Id = prj.id;

    // 3. Create Public Sale Listing
    const lst1 = await createListing({
      tenantId: tenant1,
      developerId: dev1Id,
      projectId: prj1Id,
      title: 'Luxury 4BR Villa in Sedra',
      listingType: 'SALE',
      category: 'RESIDENTIAL',
      propertyType: 'VILLA',
      priceSar: 1850000,
      city: 'Riyadh',
      district: 'An Narjis',
      bedrooms: 4,
      bathrooms: 4,
      areaSqm: 350,
      featured: true,
    });
    lst1Id = lst1.id;

    // 4. Create Public Rent Listing
    const lst2 = await createListing({
      tenantId: tenant1,
      title: 'Modern Executive Apartment in Olaya',
      listingType: 'RENT',
      category: 'RESIDENTIAL',
      propertyType: 'APARTMENT',
      priceSar: 85000,
      rentFrequency: 'ANNUAL',
      city: 'Riyadh',
      district: 'Olaya',
      bedrooms: 2,
      bathrooms: 2,
      areaSqm: 140,
    });
    lst2Id = lst2.id;
  });

  it('1. Should handle Developer profiles lifecycle', async () => {
    const devs = await listDevelopers(tenant1);
    expect(devs.length).toBeGreaterThanOrEqual(1);

    const dev = await getDeveloper(tenant1, dev1Id);
    expect(dev?.name).toBe('Roshn Real Estate');

    const updated = await updateDeveloper(tenant1, dev1Id, { website: 'https://roshn.sa' });
    expect(updated?.website).toBe('https://roshn.sa');
  });

  it('2. Should handle Developer Master Projects & Master Plans', async () => {
    const projects = await listProjects(tenant1, { developerId: dev1Id });
    expect(projects.length).toBeGreaterThanOrEqual(1);

    const prj = await getProject(tenant1, prj1Id);
    expect(prj?.title).toBe('Sedra Master Development');
    expect(prj?.constructionProgressPct).toBe(70);
  });

  it('3. Should search & filter Public Listings with high precision', async () => {
    // Filter by listingType: SALE
    const salesListings = await searchPublicListings(tenant1, { listingType: 'SALE' });
    expect(salesListings.some((l) => l.id === lst1Id)).toBe(true);

    // Filter by district: Olaya
    const olayaListings = await searchPublicListings(tenant1, { district: 'Olaya' });
    expect(olayaListings.length).toBe(1);
    expect(olayaListings[0].id).toBe(lst2Id);

    // Filter by price range
    const cheapListings = await searchPublicListings(tenant1, { maxPrice: 100000 });
    expect(cheapListings.length).toBe(1);
    expect(cheapListings[0].id).toBe(lst2Id);
  });

  it('4. Should support Natural Language AI Property Search', async () => {
    const searchRes = await aiSearchPublicListings(
      tenant1,
      'I am looking for a luxury villa for sale in Riyadh near Narjis'
    );

    expect(searchRes.interpretedFilters.propertyType).toBe('VILLA');
    expect(searchRes.interpretedFilters.listingType).toBe('SALE');
    expect(searchRes.interpretedFilters.city).toBe('Riyadh');
    expect(searchRes.interpretedFilters.district).toBe('An Narjis');
    expect(searchRes.listings.length).toBeGreaterThanOrEqual(1);
  });

  it('5. Should calculate AI Property Valuation (AVM)', async () => {
    const valuation = await generateAiValuation({
      tenantId: tenant1,
      userId: user1,
      city: 'Riyadh',
      district: 'Al Malqa',
      propertyType: 'VILLA',
      areaSqm: 400,
      bedrooms: 5,
    });

    expect(valuation.id).toBeDefined();
    expect(Number(valuation.estimatedPriceAvgSar)).toBeGreaterThan(2000000);
    expect(valuation.confidenceScorePct).toBe(92);
    expect(valuation.marketTrend).toBe('UPWARD');
  });

  it('6. Should store user Saved Searches and Favorites', async () => {
    // Save search
    const saved = await saveUserSearch({
      tenantId: tenant1,
      userId: user1,
      title: 'Riyadh Villas under 2M SAR',
      filtersJson: { city: 'Riyadh', propertyType: 'VILLA', maxPrice: 2000000 },
    });
    expect(saved.id).toBeDefined();

    const searches = await listUserSavedSearches(tenant1, user1);
    expect(searches.length).toBe(1);

    // Toggle favorite
    const favResult = await toggleFavoriteProperty(tenant1, user1, lst1Id);
    expect(favResult.favorited).toBe(true);

    const favs = await listUserFavorites(tenant1, user1);
    expect(favs.length).toBe(1);
    expect(favs[0].id).toBe(lst1Id);

    // Toggle unfavorite
    const unfavResult = await toggleFavoriteProperty(tenant1, user1, lst1Id);
    expect(unfavResult.favorited).toBe(false);
  });

  it('7. Should handle Public Marketplace Inquiries & Lead Capture', async () => {
    const inq = await createInquiry({
      tenantId: tenant1,
      listingId: lst1Id,
      name: 'Sultan Al-Ghamdi',
      email: 'sultan@example.sa',
      phone: '+966551234567',
      message: 'Can I schedule a viewing this Thursday?',
      inquiryType: 'VISIT',
    });

    expect(inq.id).toBeDefined();
    expect(inq.status).toBe('NEW');

    const inqList = await listInquiries(tenant1);
    expect(inqList.length).toBeGreaterThanOrEqual(1);

    const updated = await updateInquiryStatus(tenant1, inq.id, 'CONTACTED');
    expect(updated?.status).toBe('CONTACTED');
  });

  it('8. Should compute complete Phase 4 Marketplace Metrics', async () => {
    const metrics = await getPhase4MarketplaceMetrics(tenant1);

    expect(metrics.totalListings).toBeGreaterThanOrEqual(2);
    expect(metrics.saleListings).toBeGreaterThanOrEqual(1);
    expect(metrics.rentListings).toBeGreaterThanOrEqual(1);
    expect(metrics.totalDevelopers).toBeGreaterThanOrEqual(1);
    expect(metrics.totalProjects).toBeGreaterThanOrEqual(1);
  });
});
