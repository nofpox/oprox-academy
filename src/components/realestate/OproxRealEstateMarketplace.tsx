import React, { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Eye,
  Heart,
  Bookmark,
  Send,
  Calculator,
  Compass,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowUpDown,
  Maximize2,
  Globe,
  Share2,
  X,
  Phone,
  Mail,
  Filter,
  Check,
} from 'lucide-react';

export const OproxRealEstateMarketplace: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'listings' | 'projects' | 'developers' | 'aiValuation' | 'comparison' | 'saved' | 'inquiries'
  >('listings');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [listings, setListings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<'ALL' | 'SALE' | 'RENT'>('ALL');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState('');
  const [aiSearchResults, setAiSearchResults] = useState<any | null>(null);

  // AVM Valuation state
  const [avmCity, setAvmCity] = useState('Riyadh');
  const [avmDistrict, setAvmDistrict] = useState('Al Malqa');
  const [avmPropType, setAvmPropType] = useState('VILLA');
  const [avmArea, setAvmArea] = useState('380');
  const [avmBedrooms, setAvmBedrooms] = useState('4');
  const [avmResult, setAvmResult] = useState<any | null>(null);

  // Comparison state
  const [compareItems, setCompareItems] = useState<any[]>([]);

  // Modals state
  const [isNewListingModalOpen, setIsNewListingModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [selectedListingForInquiry, setSelectedListingForInquiry] = useState<any | null>(null);

  // Form states
  const [newListingTitle, setNewListingTitle] = useState('');
  const [newListingType, setNewListingType] = useState('SALE');
  const [newListingPropType, setNewListingPropType] = useState('VILLA');
  const [newListingPrice, setNewListingPrice] = useState('1650000');
  const [newListingCity, setNewListingCity] = useState('Riyadh');
  const [newListingDistrict, setNewListingDistrict] = useState('An Narjis');

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');

  // Fetch Data
  const fetchMarketplaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, projRes, devRes, inqRes, srchRes, favRes] = await Promise.all([
        fetch('/api/real-estate/marketplace/listings'),
        fetch('/api/real-estate/projects'),
        fetch('/api/real-estate/developers'),
        fetch('/api/real-estate/marketplace/inquiries'),
        fetch('/api/real-estate/marketplace/saved-searches'),
        fetch('/api/real-estate/marketplace/favorites'),
      ]);

      if (listRes.ok) {
        const d = await listRes.json();
        setListings(d.listings || []);
      }
      if (projRes.ok) {
        const d = await projRes.json();
        setProjects(d.projects || []);
      }
      if (devRes.ok) {
        const d = await devRes.json();
        setDevelopers(d.developers || []);
      }
      if (inqRes.ok) {
        const d = await inqRes.json();
        setInquiries(d.inquiries || []);
      }
      if (srchRes.ok) {
        const d = await srchRes.json();
        setSavedSearches(d.savedSearches || []);
      }
      if (favRes.ok) {
        const d = await favRes.json();
        setFavorites(d.favorites || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch marketplace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  // Handlers
  const handleNaturalLanguageSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguagePrompt) return;
    setLoading(true);
    try {
      const res = await fetch('/api/real-estate/marketplace/search/natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: naturalLanguagePrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSearchResults(data);
        if (data.listings) setListings(data.listings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAvmValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/real-estate/marketplace/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: avmCity,
          district: avmDistrict,
          propertyType: avmPropType,
          areaSqm: Number(avmArea),
          bedrooms: Number(avmBedrooms),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvmResult(data.valuation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingTitle) return;
    try {
      const res = await fetch('/api/real-estate/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newListingTitle,
          listingType: newListingType,
          propertyType: newListingPropType,
          priceSar: Number(newListingPrice),
          city: newListingCity,
          district: newListingDistrict,
          bedrooms: 3,
          bathrooms: 3,
          areaSqm: 240,
        }),
      });
      if (res.ok) {
        setIsNewListingModalOpen(false);
        setNewListingTitle('');
        fetchMarketplaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (listingId: string) => {
    try {
      const res = await fetch('/api/real-estate/marketplace/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      if (res.ok) {
        fetchMarketplaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCurrentSearch = async () => {
    try {
      const title = `Search ${selectedCity !== 'ALL' ? selectedCity : 'All'} - ${listingTypeFilter}`;
      const res = await fetch('/api/real-estate/marketplace/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          filtersJson: { city: selectedCity, listingType: listingTypeFilter, propertyType: propertyTypeFilter },
        }),
      });
      if (res.ok) {
        fetchMarketplaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) return;
    try {
      const res = await fetch('/api/real-estate/marketplace/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListingForInquiry?.id,
          name: inquiryName,
          email: inquiryEmail || 'buyer@example.sa',
          phone: inquiryPhone,
          message: inquiryMessage,
        }),
      });
      if (res.ok) {
        setIsInquiryModalOpen(false);
        setInquiryName('');
        setInquiryPhone('');
        setInquiryMessage('');
        fetchMarketplaceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCompare = (item: any) => {
    if (compareItems.some((c) => c.id === item.id)) {
      setCompareItems(compareItems.filter((c) => c.id !== item.id));
    } else {
      if (compareItems.length >= 4) return;
      setCompareItems([...compareItems, item]);
    }
  };

  // Filtered Listings
  const filteredListings = listings.filter((l) => {
    if (listingTypeFilter !== 'ALL' && l.listingType !== listingTypeFilter) return false;
    if (propertyTypeFilter !== 'ALL' && l.propertyType !== propertyTypeFilter) return false;
    if (selectedCity !== 'ALL' && l.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.district.toLowerCase().includes(q) ||
        l.propertyType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('listings')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'listings'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Public Listings ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('projects')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'projects'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Projects & Master Plans ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('developers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'developers'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Developers ({developers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('aiValuation')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'aiValuation'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Valuation (AVM)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'comparison'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Compare ({compareItems.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('saved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'saved'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved & Favorites ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inquiries')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'inquiries'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Inquiries Inbox ({inquiries.length})</span>
        </button>
      </div>

      {/* SUB-VIEW 1: PUBLIC LISTINGS */}
      {activeSubTab === 'listings' && (
        <div className="space-y-6">
          {/* Natural Language Search Bar */}
          <form onSubmit={handleNaturalLanguageSearch} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Smart AI Natural Language Search</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={naturalLanguagePrompt}
                onChange={(e) => setNaturalLanguagePrompt(e.target.value)}
                placeholder="e.g. 'I am looking for a luxury villa for sale in Riyadh near Narjis under 2M SAR'"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
            {aiSearchResults && (
              <p className="text-[11px] text-amber-300/80 italic font-mono">
                {aiSearchResults.summary}
              </p>
            )}
          </form>

          {/* Structured Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setListingTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded font-medium ${listingTypeFilter === 'ALL' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setListingTypeFilter('SALE')}
                  className={`px-2.5 py-1 rounded font-medium ${listingTypeFilter === 'SALE' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
                >
                  Sale
                </button>
                <button
                  onClick={() => setListingTypeFilter('RENT')}
                  className={`px-2.5 py-1 rounded font-medium ${listingTypeFilter === 'RENT' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}
                >
                  Rent
                </button>
              </div>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="ALL">All Cities</option>
                <option value="Riyadh">Riyadh</option>
                <option value="Jeddah">Jeddah</option>
                <option value="Dammam">Dammam</option>
              </select>

              <select
                value={propertyTypeFilter}
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="ALL">All Property Types</option>
                <option value="VILLA">Villa</option>
                <option value="APARTMENT">Apartment</option>
                <option value="DUPLEX">Duplex</option>
                <option value="PENTHOUSE">Penthouse</option>
                <option value="OFFICE">Office</option>
              </select>

              <button
                onClick={handleSaveCurrentSearch}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3 text-amber-400" />
                <span>Save Search</span>
              </button>
            </div>

            <button
              onClick={() => setIsNewListingModalOpen(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Listing</span>
            </button>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((lst) => {
              const isFav = favorites.some((f) => f.id === lst.id);
              const isComp = compareItems.some((c) => c.id === lst.id);

              return (
                <div key={lst.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        lst.listingType === 'SALE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {lst.listingType} • {lst.propertyType}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleFavorite(lst.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${isFav ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                        >
                          <Heart className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => toggleCompare(lst)}
                          className={`p-1.5 rounded-lg border transition-colors ${isComp ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1">{lst.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{lst.district}, {lst.city}</span>
                    </p>

                    <div className="pt-2 flex items-baseline gap-1 text-amber-400 font-extrabold text-base">
                      <span>{Number(lst.priceSar).toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-normal">SAR {lst.rentFrequency ? `/ ${lst.rentFrequency.toLowerCase()}` : ''}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <div>Beds: <strong className="text-slate-200">{lst.bedrooms || 0}</strong></div>
                      <div>Baths: <strong className="text-slate-200">{lst.bathrooms || 0}</strong></div>
                      <div>Area: <strong className="text-slate-200">{lst.areaSqm || 0} sqm</strong></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{lst.viewCount || 0} views</span>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedListingForInquiry(lst);
                        setIsInquiryModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3 text-amber-400" />
                      <span>Inquire</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: PROJECTS & MASTER PLANS */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((prj) => (
              <div key={prj.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Master Project
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{prj.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{prj.district}, {prj.city}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Starting From</span>
                    <div className="text-sm font-black text-amber-400">
                      {Number(prj.startingPriceSar).toLocaleString()} SAR
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>Construction Progress</span>
                    <span className="text-amber-400 font-bold">{prj.constructionProgressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${prj.constructionProgressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div>Total Units: <strong className="text-slate-200">{prj.totalUnits}</strong></div>
                  <div>Available: <strong className="text-emerald-400">{prj.availableUnits}</strong></div>
                  <div>Completion: <strong className="text-slate-200">{prj.completionYear}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: DEVELOPERS */}
      {activeSubTab === 'developers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {developers.map((dev) => (
            <div key={dev.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
                  {dev.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{dev.name}</span>
                    {dev.verified && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </h3>
                  <p className="text-xs text-slate-400">{dev.headquartersCity} HQ</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div>Projects: <strong className="text-slate-200">{dev.totalProjects || 0}</strong></div>
                <div>Rating: <strong className="text-amber-400">{dev.rating || 4.8} / 5.0</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-VIEW 4: AI VALUATION (AVM) */}
      {activeSubTab === 'aiValuation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleRunAvmValuation} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Calculator className="w-5 h-5 text-amber-400" />
              <span>Automated Valuation Model (AVM)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">City</label>
                <select
                  value={avmCity}
                  onChange={(e) => setAvmCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="Riyadh">Riyadh</option>
                  <option value="Jeddah">Jeddah</option>
                  <option value="Dammam">Dammam</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">District</label>
                <input
                  type="text"
                  value={avmDistrict}
                  onChange={(e) => setAvmDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Property Type</label>
                <select
                  value={avmPropType}
                  onChange={(e) => setAvmPropType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="VILLA">Villa</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="PENTHOUSE">Penthouse</option>
                  <option value="DUPLEX">Duplex</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Built-Up Area (Sqm)</label>
                <input
                  type="number"
                  value={avmArea}
                  onChange={(e) => setAvmArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculate Valuation</span>
            </button>
          </form>

          {avmResult ? (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Estimated Market Value
              </span>

              <div className="space-y-1">
                <div className="text-2xl font-black text-amber-400">
                  {Number(avmResult.estimatedPriceAvgSar).toLocaleString()} SAR
                </div>
                <div className="text-xs text-slate-400">
                  Range: {Number(avmResult.estimatedPriceMinSar).toLocaleString()} - {Number(avmResult.estimatedPriceMaxSar).toLocaleString()} SAR
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>Price / Sqm: <strong className="text-slate-200">{Number(avmResult.estimatedPricePerSqmSar).toLocaleString()} SAR</strong></div>
                <div>Confidence: <strong className="text-emerald-400">{avmResult.confidenceScorePct}%</strong></div>
                <div>Comps Analyzed: <strong className="text-slate-200">{avmResult.comparableCount}</strong></div>
                <div>Market Trend: <strong className="text-cyan-400">{avmResult.marketTrend}</strong></div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                {avmResult.aiAnalysisSummary}
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Calculator className="w-8 h-8 text-slate-600" />
              <p className="text-xs">Enter property attributes and press Calculate Valuation to generate AVM estimates.</p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 5: PROPERTY COMPARISON */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-4">
          {compareItems.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 space-y-2">
              <ArrowUpDown className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">No properties selected for comparison. Click the comparison icon on any listing to compare up to 4 properties side by side.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {compareItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                    <button onClick={() => toggleCompare(item)} className="text-slate-500 hover:text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-sm font-extrabold text-amber-400">
                    {Number(item.priceSar).toLocaleString()} SAR
                  </div>
                  <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800 pt-2">
                    <div>City: {item.city}</div>
                    <div>District: {item.district}</div>
                    <div>Bedrooms: {item.bedrooms}</div>
                    <div>Bathrooms: {item.bathrooms}</div>
                    <div>Area: {item.areaSqm} sqm</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 6: SAVED & FAVORITES */}
      {activeSubTab === 'saved' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Favorited Properties ({favorites.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {favorites.map((fav) => (
                <div key={fav.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">{fav.title}</h4>
                    <span className="text-[11px] text-amber-400 font-bold">{Number(fav.priceSar).toLocaleString()} SAR</span>
                  </div>
                  <button onClick={() => handleToggleFavorite(fav.id)} className="text-rose-400 p-1">
                    <Heart className="w-4 h-4" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: INQUIRIES */}
      {activeSubTab === 'inquiries' && (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{inq.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{inq.status}</span>
                </div>
                <div className="text-slate-400 mt-1">{inq.phone} • {inq.email}</div>
                <p className="text-slate-300 italic mt-1 font-mono">{inq.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INQUIRY MODAL */}
      {isInquiryModalOpen && selectedListingForInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Inquire about {selectedListingForInquiry.title}</h3>
              <button onClick={() => setIsInquiryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInquiry} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="e.g. Sultan Al-Ghamdi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="+966501234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Message</label>
                <textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={3}
                  placeholder="I am interested in scheduling a site visit..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
              >
                Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LISTING MODAL */}
      {isNewListingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create Public Marketplace Listing</h3>
              <button onClick={() => setIsNewListingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newListingTitle}
                  onChange={(e) => setNewListingTitle(e.target.value)}
                  placeholder="Luxury 4BR Villa in Sedra"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Type</label>
                  <select
                    value={newListingType}
                    onChange={(e) => setNewListingType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="SALE">SALE</option>
                    <option value="RENT">RENT</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Property</label>
                  <select
                    value={newListingPropType}
                    onChange={(e) => setNewListingPropType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="VILLA">VILLA</option>
                    <option value="APARTMENT">APARTMENT</option>
                    <option value="DUPLEX">DUPLEX</option>
                    <option value="OFFICE">OFFICE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Price (SAR)</label>
                <input
                  type="number"
                  value={newListingPrice}
                  onChange={(e) => setNewListingPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
              >
                Publish Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
