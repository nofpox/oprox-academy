import React, { useState, useEffect } from 'react';
import {
  Building2,
  Home,
  Layers,
  Users,
  Plus,
  Search,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Globe,
  Trash2,
  Edit,
  Eye,
  Info,
  UserPlus,
  Calendar,
  Tag,
  Compass,
  Sparkles,
  Clock,
  CheckSquare
} from 'lucide-react';

interface Portfolio {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: string;
  createdAt: string;
}

interface Property {
  id: string;
  portfolioId?: string;
  name: string;
  type: string;
  status: string;
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
  totalUnitsCount: number;
}

interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  unitType: string;
  status: string;
  areaSqm?: string;
  bedrooms?: number;
  bathrooms?: number;
  rentPriceSar?: string;
  salePriceSar?: string;
}

interface Owner {
  id: string;
  fullName: string;
  ownerType: string;
  nationalIdOrCr?: string;
  email?: string;
  phone?: string;
}

interface DashboardMetrics {
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

import { OproxRealEstateMarketplace } from './OproxRealEstateMarketplace';
import { OproxRealEstatePhase5Suite } from './OproxRealEstatePhase5Suite';
import { OproxRealEstatePhase6Suite } from './OproxRealEstatePhase6Suite';

export const OproxRealEstateWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'portfolios' | 'properties' | 'units' | 'owners' | 'contacts' | 'tenants' | 'leases' | 'payments' | 'securityDeposits' | 'crmLeads' | 'crmViewings' | 'crmOffers' | 'crmReservations' | 'marketplace' | 'phase5Suite' | 'phase6Suite'
  >('phase6Suite');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 1 Data state
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);

  // Phase 2 Data state
  const [contacts, setContacts] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [phase2Metrics, setPhase2Metrics] = useState<any>(null);

  // Phase 3 Data state
  const [leads, setLeads] = useState<any[]>([]);
  const [viewings, setViewings] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [crmMetrics, setCrmMetrics] = useState<any>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal / Form state
  const [isCreatePropModalOpen, setIsCreatePropModalOpen] = useState(false);
  const [isCreatePortfolioModalOpen, setIsCreatePortfolioModalOpen] = useState(false);
  const [isCreateUnitModalOpen, setIsCreateUnitModalOpen] = useState(false);
  const [isCreateOwnerModalOpen, setIsCreateOwnerModalOpen] = useState(false);
  const [isCreateContactModalOpen, setIsCreateContactModalOpen] = useState(false);
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false);
  const [isCreateLeaseModalOpen, setIsCreateLeaseModalOpen] = useState(false);
  const [isCreatePaymentModalOpen, setIsCreatePaymentModalOpen] = useState(false);

  // Form values
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState('apartment_building');
  const [newPropCity, setNewPropCity] = useState('Riyadh');
  const [newPropDistrict, setNewPropDistrict] = useState('');
  const [newPropArea, setNewPropArea] = useState('1200');

  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioCode, setNewPortfolioCode] = useState('');

  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newUnitPropertyId, setNewUnitPropertyId] = useState('');
  const [newUnitType, setNewUnitType] = useState('apartment');
  const [newUnitRentSar, setNewUnitRentSar] = useState('45000');

  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerType, setNewOwnerType] = useState('INDIVIDUAL');
  const [newOwnerIdCr, setNewOwnerIdCr] = useState('');

  // Phase 2 Form values
  const [newContactName, setNewContactName] = useState('');
  const [newContactType, setNewContactType] = useState('INDIVIDUAL');
  const [newContactCrVat, setNewContactCrVat] = useState('');

  const [newTenantContactId, setNewTenantContactId] = useState('');

  const [newLeasePropId, setNewLeasePropId] = useState('');
  const [newLeaseTenantId, setNewLeaseTenantId] = useState('');
  const [newLeaseValue, setNewLeaseValue] = useState('120000');
  const [newLeaseStart, setNewLeaseStart] = useState('2026-01-01');
  const [newLeaseEnd, setNewLeaseEnd] = useState('2026-12-31');

  const [newPaymentLeaseId, setNewPaymentLeaseId] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('30000');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        dashRes,
        portRes,
        propRes,
        unitRes,
        ownRes,
        contRes,
        tenRes,
        lseRes,
        payRes,
        depRes,
        p2DashRes,
        leadRes,
        vwRes,
        ofrRes,
        resRes,
        crmDashRes,
      ] = await Promise.all([
        fetch('/api/real-estate/dashboard'),
        fetch('/api/real-estate/portfolios'),
        fetch('/api/real-estate/properties'),
        fetch('/api/real-estate/units'),
        fetch('/api/real-estate/owners'),
        fetch('/api/real-estate/contacts'),
        fetch('/api/real-estate/tenants'),
        fetch('/api/real-estate/leases'),
        fetch('/api/real-estate/payments'),
        fetch('/api/real-estate/security-deposits'),
        fetch('/api/real-estate/phase2-dashboard'),
        fetch('/api/real-estate/leads'),
        fetch('/api/real-estate/viewings'),
        fetch('/api/real-estate/offers'),
        fetch('/api/real-estate/reservations'),
        fetch('/api/real-estate/crm-dashboard'),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setMetrics(d.metrics);
      }
      if (portRes.ok) {
        const p = await portRes.json();
        setPortfolios(p.portfolios || []);
      }
      if (propRes.ok) {
        const pr = await propRes.json();
        setProperties(pr.properties || []);
      }
      if (unitRes.ok) {
        const u = await unitRes.json();
        setUnits(u.units || []);
      }
      if (ownRes.ok) {
        const o = await ownRes.json();
        setOwners(o.owners || []);
      }
      if (contRes.ok) {
        const c = await contRes.json();
        setContacts(c.contacts || []);
      }
      if (tenRes.ok) {
        const t = await tenRes.json();
        setTenants(t.tenants || []);
      }
      if (lseRes.ok) {
        const l = await lseRes.json();
        setLeases(l.leases || []);
      }
      if (payRes.ok) {
        const py = await payRes.json();
        setPayments(py.payments || []);
      }
      if (depRes.ok) {
        const dp = await depRes.json();
        setDeposits(dp.deposits || []);
      }
      if (p2DashRes.ok) {
        const p2 = await p2DashRes.json();
        setPhase2Metrics(p2.metrics);
      }
      if (leadRes.ok) {
        const ld = await leadRes.json();
        setLeads(ld.leads || []);
      }
      if (vwRes.ok) {
        const vw = await vwRes.json();
        setViewings(vw.viewings || []);
      }
      if (ofrRes.ok) {
        const ofr = await ofrRes.json();
        setOffers(ofr.offers || []);
      }
      if (resRes.ok) {
        const rs = await resRes.json();
        setReservations(rs.reservations || []);
      }
      if (crmDashRes.ok) {
        const crmd = await crmDashRes.json();
        setCrmMetrics(crmd.metrics);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sync with Real Estate API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName) return;
    try {
      const res = await fetch('/api/real-estate/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPropName,
          type: newPropType,
          addressCity: newPropCity,
          addressDistrict: newPropDistrict || 'Al Malaz',
          addressRegion: 'Riyadh Region',
          totalAreaSqm: newPropArea,
          status: 'ACTIVE',
        }),
      });
      if (res.ok) {
        setIsCreatePropModalOpen(false);
        setNewPropName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName) return;
    try {
      const res = await fetch('/api/real-estate/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPortfolioName,
          code: newPortfolioCode || 'FOL-01',
        }),
      });
      if (res.ok) {
        setIsCreatePortfolioModalOpen(false);
        setNewPortfolioName('');
        setNewPortfolioCode('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitNumber || !newUnitPropertyId) return;
    try {
      const res = await fetch('/api/real-estate/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: newUnitPropertyId,
          unitNumber: newUnitNumber,
          unitType: newUnitType,
          rentPriceSar: newUnitRentSar,
          status: 'AVAILABLE',
        }),
      });
      if (res.ok) {
        setIsCreateUnitModalOpen(false);
        setNewUnitNumber('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerName) return;
    try {
      const res = await fetch('/api/real-estate/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newOwnerName,
          ownerType: newOwnerType,
          nationalIdOrCr: newOwnerIdCr,
        }),
      });
      if (res.ok) {
        setIsCreateOwnerModalOpen(false);
        setNewOwnerName('');
        setNewOwnerIdCr('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Properties
  const filteredProperties = properties.filter((p) => {
    if (selectedCity && p.addressCity !== selectedCity) return false;
    if (selectedType && p.type !== selectedType) return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.addressCity && p.addressCity.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wide">
                OPROX Real Estate
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Peer OS Product
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise Asset Hierarchy, Saudi Postal Address Registry, Portfolio Operations & Property Management Engine.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>MAP PROVIDER: <strong className="text-amber-400">NOT_CONFIGURED</strong></span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Engine</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Operational Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolios')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'portfolios'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Portfolios ({portfolios.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'properties'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Properties ({properties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'units'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Units ({units.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('owners')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'owners'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Property Owners ({owners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('crmLeads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'crmLeads'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Leads Pipeline ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('crmViewings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'crmViewings'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Viewings ({viewings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('crmOffers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'crmOffers'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Offers ({offers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('crmReservations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'crmReservations'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Reservations ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'marketplace'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>PropTech Marketplace (Phase 4)</span>
        </button>

        <button
          onClick={() => setActiveTab('phase5Suite')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'phase5Suite'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Design & Investment (Phase 5)</span>
        </button>

        <button
          onClick={() => setActiveTab('phase6Suite')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'phase6Suite'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>3D / VR / AR & Digital Twin (Phase 6)</span>
        </button>
      </div>

      {/* PHASE 6 SUITE TAB */}
      {activeTab === 'phase6Suite' && <OproxRealEstatePhase6Suite />}

      {/* PHASE 5 SUITE TAB */}
      {activeTab === 'phase5Suite' && <OproxRealEstatePhase5Suite />}

      {/* MARKETPLACE TAB */}
      {activeTab === 'marketplace' && <OproxRealEstateMarketplace />}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-semibold">Total Portfolios</p>
              <p className="text-2xl font-black text-white">{metrics?.totalPortfolios ?? portfolios.length}</p>
              <p className="text-[10px] text-amber-400">Database-backed</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-semibold">Managed Properties</p>
              <p className="text-2xl font-black text-white">{metrics?.totalProperties ?? properties.length}</p>
              <p className="text-[10px] text-cyan-400">Saudi-ready addresses</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-semibold">Occupancy Rate</p>
              <p className="text-2xl font-black text-emerald-400">{metrics?.occupancyRatePercent ?? 0}%</p>
              <p className="text-[10px] text-emerald-400">Active leased units</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-semibold">Registered Owners</p>
              <p className="text-2xl font-black text-indigo-400">{metrics?.totalOwners ?? owners.length}</p>
              <p className="text-[10px] text-indigo-400">Individual & Corporate</p>
            </div>
          </div>

          {/* System Rules & Compliance Status Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>OPROX Real Estate Engine Architecture Status</span>
              </span>
              <span className="text-emerald-400 font-bold text-[11px] uppercase">Phase 1 Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 pt-1">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <p className="text-[11px] font-bold text-slate-400">PRODUCT INTEGRATION</p>
                <p className="text-emerald-400 font-bold">First-Class Product</p>
                <p className="text-[10px] text-slate-500">Peer to Code/AI & Studio</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <p className="text-[11px] font-bold text-slate-400">MAP PROVIDER STATUS</p>
                <p className="text-amber-400 font-bold">NOT_CONFIGURED</p>
                <p className="text-[10px] text-slate-500">Provider-independent lat/lng</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <p className="text-[11px] font-bold text-slate-400">FINANCIAL LEDGER</p>
                <p className="text-cyan-400 font-bold">EXTENSION_REQUIRED</p>
                <p className="text-[10px] text-slate-500">Zero duplicate wallet tables</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PORTFOLIOS TAB */}
      {activeTab === 'portfolios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Asset Portfolios</h2>
            <button
              onClick={() => setIsCreatePortfolioModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Portfolio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{p.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                    {p.status}
                  </span>
                </div>
                {p.code && <p className="text-xs font-mono text-amber-400">Code: {p.code}</p>}
                {p.description && <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>}
              </div>
            ))}

            {portfolios.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
                No portfolios created yet. Click "New Portfolio" to establish an asset container.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROPERTIES TAB */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search properties or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 w-48 sm:w-64"
                />
              </div>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Cities</option>
                <option value="Riyadh">Riyadh</option>
                <option value="Jeddah">Jeddah</option>
                <option value="Dammam">Dammam</option>
                <option value="Al Khobar">Al Khobar</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="apartment_building">Apartment Building</option>
                <option value="commercial_tower">Commercial Tower</option>
                <option value="residential_compound">Residential Compound</option>
                <option value="standalone_villa">Standalone Villa</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>

            <button
              onClick={() => setIsCreatePropModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Property</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Property Name</th>
                  <th className="p-3">Asset Type</th>
                  <th className="p-3">Saudi City / District</th>
                  <th className="p-3">Total Area (sqm)</th>
                  <th className="p-3">Units</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{p.name}</span>
                    </td>
                    <td className="p-3 text-cyan-400 uppercase text-[11px] font-semibold">
                      {p.type.replace('_', ' ')}
                    </td>
                    <td className="p-3 text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{p.addressCity || 'N/A'}{p.addressDistrict ? `, ${p.addressDistrict}` : ''}</span>
                    </td>
                    <td className="p-3">{p.totalAreaSqm ? `${p.totalAreaSqm} m²` : '-'}</td>
                    <td className="p-3 font-bold text-white">{p.totalUnitsCount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'ACTIVE' || p.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredProperties.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No properties found matching criteria. Click "Create Property" to register a new real estate asset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UNITS TAB */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Managed Units</h2>
            <button
              onClick={() => setIsCreateUnitModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Unit Number</th>
                  <th className="p-3">Property ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Annual Rent (SAR)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{u.unitNumber}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{u.propertyId}</td>
                    <td className="p-3 text-cyan-400 uppercase text-[11px]">{u.unitType}</td>
                    <td className="p-3 text-emerald-400 font-bold">
                      {u.rentPriceSar ? `${Number(u.rentPriceSar).toLocaleString()} SAR/yr` : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : u.status === 'LEASED'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {units.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No units created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OWNERS TAB */}
      {activeTab === 'owners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Property Owners Registry</h2>
            <button
              onClick={() => setIsCreateOwnerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Register Owner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {owners.map((o) => (
              <div key={o.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{o.fullName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-bold">
                    {o.ownerType}
                  </span>
                </div>
                {o.nationalIdOrCr && <p className="text-xs font-mono text-slate-400">ID / CR: {o.nationalIdOrCr}</p>}
              </div>
            ))}

            {owners.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
                No property owners registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRM LEADS TAB */}
      {activeTab === 'crmLeads' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>Leads & Qualification Pipeline</span>
              </h2>
              <p className="text-xs text-slate-400">Total active pipeline: {crmMetrics?.totalLeads ?? leads.length} leads</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">QUALIFIED LEADS</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">{crmMetrics?.leadsByStatus?.QUALIFIED || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">ACTIVE VIEWINGS</span>
              <p className="text-xl font-bold text-amber-400 mt-1">{crmMetrics?.scheduledViewings || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">ACTIVE OFFERS</span>
              <p className="text-xl font-bold text-cyan-400 mt-1">{crmMetrics?.activeOffers || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">CONVERSION RATE</span>
              <p className="text-xl font-bold text-purple-400 mt-1">{crmMetrics?.conversionRatePercent || 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((ld) => (
              <div key={ld.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{ld.fullName}</h3>
                    <p className="text-xs text-slate-400">{ld.phone || ld.email || 'No contact details'}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    ld.status === 'CLOSED_WON' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    ld.status === 'CLOSED_LOST' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {ld.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 text-[10px]">INTENT:</span> {ld.intentType || 'RENT'}
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">PRIORITY:</span> {ld.priority || 'MEDIUM'}
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">BUDGET MAX:</span> {ld.budgetMaxSar ? `${Number(ld.budgetMaxSar).toLocaleString()} SAR` : 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">PREFERRED CITY:</span> {ld.preferredCity || 'Riyadh'}
                  </div>
                </div>
              </div>
            ))}

            {leads.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
                No active leads in pipeline.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRM VIEWINGS TAB */}
      {activeTab === 'crmViewings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>Property Viewings Schedule</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {viewings.map((vw) => (
              <div key={vw.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs">{new Date(vw.scheduledAt).toLocaleString()}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    vw.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    vw.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {vw.status}
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 font-mono">
                  <p><span className="text-slate-500">VIEWING CODE:</span> {vw.viewingCode}</p>
                  {vw.feedback && <p><span className="text-slate-500">FEEDBACK:</span> {vw.feedback}</p>}
                </div>
              </div>
            ))}

            {viewings.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
                No viewings scheduled yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRM OFFERS TAB */}
      {activeTab === 'crmOffers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              <span>Commercial Offers & Negotiations</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((ofr) => (
              <div key={ofr.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">{ofr.offerCode}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    ofr.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    ofr.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {ofr.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-white">{Number(ofr.offeredAmountSar).toLocaleString()} SAR</p>
                  <p className="text-xs text-slate-400">Payment Terms: {ofr.paymentTermMonths || 12} months</p>
                </div>
              </div>
            ))}

            {offers.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
                No offers created yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRM RESERVATIONS TAB */}
      {activeTab === 'crmReservations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <span>Unit Reservations & Lease Handoff</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservations.map((rs) => (
              <div key={rs.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">{rs.reservationCode}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    rs.status === 'CONVERTED_TO_LEASE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    rs.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {rs.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300 font-mono">
                  <p><span className="text-slate-500">RESERVATION FEE:</span> {Number(rs.reservationFeeSar).toLocaleString()} SAR</p>
                  <p><span className="text-slate-500">EXPIRES AT:</span> {new Date(rs.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}

            {reservations.length === 0 && (
              <div className="col-span-full p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
                No active unit reservations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* Create Property Modal */}
      {isCreatePropModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Register Real Estate Property</h3>
            <form onSubmit={handleCreateProperty} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Property Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Nakheel Residential Tower"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Asset Type</label>
                <select
                  value={newPropType}
                  onChange={(e) => setNewPropType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="apartment_building">Apartment Building</option>
                  <option value="commercial_tower">Commercial Tower</option>
                  <option value="residential_compound">Residential Compound</option>
                  <option value="standalone_villa">Standalone Villa</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="land_plot">Land Plot</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Saudi City</label>
                  <input
                    type="text"
                    value={newPropCity}
                    onChange={(e) => setNewPropCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Al Malaz"
                    value={newPropDistrict}
                    onChange={(e) => setNewPropDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Area (sqm)</label>
                <input
                  type="text"
                  value={newPropArea}
                  onChange={(e) => setNewPropArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePropModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Portfolio Modal */}
      {isCreatePortfolioModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Asset Portfolio</h3>
            <form onSubmit={handleCreatePortfolio} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Portfolio Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Riyadh Commercial Assets"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Code</label>
                <input
                  type="text"
                  placeholder="e.g. FOL-01"
                  value={newPortfolioCode}
                  onChange={(e) => setNewPortfolioCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePortfolioModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Create Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Unit Modal */}
      {isCreateUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add Unit to Property</h3>
            <form onSubmit={handleCreateUnit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Property</label>
                <select
                  required
                  value={newUnitPropertyId}
                  onChange={(e) => setNewUnitPropertyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Select a property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unit Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 101"
                  value={newUnitNumber}
                  onChange={(e) => setNewUnitNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Annual Rent (SAR)</label>
                <input
                  type="text"
                  value={newUnitRentSar}
                  onChange={(e) => setNewUnitRentSar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateUnitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Add Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Owner Modal */}
      {isCreateOwnerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Register Property Owner</h3>
            <form onSubmit={handleCreateOwner} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owner Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sheikh Mohammed Al-Saud"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owner Type</label>
                <select
                  value={newOwnerType}
                  onChange={(e) => setNewOwnerType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="INDIVIDUAL">INDIVIDUAL</option>
                  <option value="CORPORATE">CORPORATE</option>
                  <option value="GOVERNMENT">GOVERNMENT</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">National ID / Commercial Register (CR)</label>
                <input
                  type="text"
                  placeholder="e.g. 1010XXXXXX"
                  value={newOwnerIdCr}
                  onChange={(e) => setNewOwnerIdCr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOwnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Owner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
