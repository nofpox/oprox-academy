import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Palette,
  Sun,
  Hammer,
  FolderKanban,
  Calculator,
  PieChart,
  Bot,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  Globe,
  Building,
  Check,
  ChevronRight,
  DollarSign,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export const OproxRealEstatePhase5Suite: React.FC = () => {
  // Language & Direction state
  const [lang, setLang] = useState<'EN' | 'AR'>('EN');
  const isRtl = lang === 'AR';

  // Sub-navigation state
  const [activeTab, setActiveTab] = useState<
    | 'aiArchitect'
    | 'interiorStudio'
    | 'exteriorLandscape'
    | 'renovationAdvisor'
    | 'designProjects'
    | 'investmentIntelligence'
    | 'investmentCompare'
    | 'aiInvestmentAdvisor'
  >('aiArchitect');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // ── MODULE 1: AI ARCHITECT STATE ───────────────────────────────────────
  const [archTitle, setArchTitle] = useState('Luxury Saudi Villa Concept');
  const [archArea, setArchArea] = useState('550');
  const [archDimensions, setArchDimensions] = useState('22m x 25m');
  const [archRooms, setArchRooms] = useState('4 En-Suite Bedrooms, Executive Majlis, Double-Height Living, Driver & Maid Quarters');
  const [archFloors, setArchFloors] = useState('2');
  const [archStyle, setArchStyle] = useState('Saudi-inspired');
  const [archUsage, setArchUsage] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'MIXED_USE'>('RESIDENTIAL');
  const [archResult, setArchResult] = useState<any>(null);

  // ── MODULE 2: INTERIOR DESIGNER STATE ───────────────────────────────
  const [intSpaceType, setIntSpaceType] = useState<any>('LIVING_ROOM');
  const [intStyle, setIntStyle] = useState<any>('Saudi-inspired');
  const [intResult, setIntResult] = useState<any>(null);

  // ── MODULE 3: EXTERIOR & LANDSCAPE STATE ───────────────────────────
  const [extStyle, setExtStyle] = useState<any>('Modern');
  const [extPool, setExtPool] = useState(true);
  const [extGarden, setExtGarden] = useState(true);
  const [extResult, setExtResult] = useState<any>(null);

  // ── MODULE 6: RENOVATION ADVISOR STATE ────────────────────────────────
  const [renArea, setRenArea] = useState('350');
  const [renAge, setRenAge] = useState('12');
  const [renCondition, setRenCondition] = useState<any>('FAIR');
  const [renScope, setRenScope] = useState<any>('FACADE_AND_INTERIOR');
  const [renBudget, setRenBudget] = useState('350000');
  const [renResult, setRenResult] = useState<any>(null);

  // ── MODULE 4 & 5: DESIGN PROJECTS & STUDIO EXPORT STATE ─────────────
  const [designProjects, setDesignProjects] = useState<any[]>([]);
  const [selectedProjectConcepts, setSelectedProjectConcepts] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // ── MODULE 7: INVESTMENT INTELLIGENCE STATE ──────────────────────────
  const [invTitle, setInvTitle] = useState('Riyadh Malaz Residential Villa');
  const [invPrice, setInvPrice] = useState('3200000');
  const [invArea, setInvArea] = useState('450');
  const [invRent, setInvRent] = useState('220000');
  const [invExpenses, setInvExpenses] = useState('25000');
  const [invOccupancy, setInvOccupancy] = useState('95');
  const [invFinancingPct, setInvFinancingPct] = useState('60');
  const [invInterestRate, setInvInterestRate] = useState('5.5');
  const [invTenure, setInvTenure] = useState('20');
  const [invResult, setInvResult] = useState<any>(null);

  // ── MODULE 7 & 8: COMPARISON & AI ADVISOR STATE ──────────────────────
  const [investmentList, setInvestmentList] = useState<any[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<any>(null);

  const [aiAdvisorPrompt, setAiAdvisorPrompt] = useState('Compare rental yields and net cash flows for my analyzed properties.');
  const [aiAdvisorResult, setAiAdvisorResult] = useState<any>(null);

  // Sync projects and investment analyses
  const syncWorkspaceData = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/real-estate/design-projects'),
        fetch('/api/real-estate/investment-analyses'),
      ]);
      if (pRes.ok) {
        const pd = await pRes.json();
        setDesignProjects(pd.projects || []);
      }
      if (iRes.ok) {
        const id = await iRes.json();
        setInvestmentList(id.analyses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    syncWorkspaceData();
  }, []);

  // Handlers
  const handleGenerateArchitect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(isRtl ? 'جاري توليد المفهوم المعماري بالذكاء الاصطناعي...' : 'Generating AI Architectural Concept...');
    try {
      const res = await fetch('/api/real-estate/ai/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: archTitle,
          areaSqm: parseFloat(archArea) || 500,
          plotDimensions: archDimensions,
          roomRequirements: archRooms,
          floorsCount: parseInt(archFloors) || 2,
          architecturalStyle: archStyle,
          usageType: archUsage,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setArchResult(d);
        syncWorkspaceData();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Error generating concept');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInterior = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(isRtl ? 'جاري تصميم الديكور الداخلي...' : 'Generating AI Interior Scheme...');
    try {
      const res = await fetch('/api/real-estate/ai/interior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceType: intSpaceType,
          style: intStyle,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setIntResult(d);
        syncWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExterior = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(isRtl ? 'جاري تصميم الواجهات والحدائق...' : 'Generating Exterior & Landscape Plan...');
    try {
      const res = await fetch('/api/real-estate/ai/exterior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facadeStyle: extStyle,
          includePool: extPool,
          includeGarden: extGarden,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setExtResult(d);
        syncWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRenovation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(isRtl ? 'جاري حساب خطة الترميم وزيادة القيمة...' : 'Calculating Renovation Plan & Value Uplift...');
    try {
      const res = await fetch('/api/real-estate/ai/renovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaSqm: parseFloat(renArea) || 300,
          propertyAgeYears: parseInt(renAge) || 10,
          currentCondition: renCondition,
          desiredRenovationScope: renScope,
          budgetSar: parseFloat(renBudget) || 300000,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setRenResult(d);
        syncWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(isRtl ? 'جاري حساب العوائد الاستثمارية والتضخم...' : 'Calculating ROI & Investment Yield Metrics...');
    try {
      const res = await fetch('/api/real-estate/investment-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: invTitle,
          purchasePriceSar: parseFloat(invPrice) || 3000000,
          areaSqm: parseFloat(invArea) || 400,
          estimatedAnnualRentSar: parseFloat(invRent) || 200000,
          operatingExpensesAnnualSar: parseFloat(invExpenses) || 20000,
          occupancyRatePct: parseFloat(invOccupancy) || 95,
          financingPercentagePct: parseFloat(invFinancingPct) || 0,
          mortgageInterestRatePct: parseFloat(invInterestRate) || 5.5,
          loanTenureYears: parseInt(invTenure) || 20,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setInvResult(d.analysis);
        syncWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToStudio = async (projectId: string) => {
    setLoading(true);
    setStatusMessage(isRtl ? 'جاري التصدير إلى OPROX Studio...' : 'Exporting Project to OPROX Studio Boundary...');
    try {
      const res = await fetch(`/api/real-estate/design-projects/${projectId}/export-studio`, {
        method: 'POST',
      });
      if (res.ok) {
        const d = await res.json();
        alert(
          isRtl
            ? `تم تصدير المشروع بنجاح مع معرف Studio: ${d.studioProjectId}`
            : `Project exported successfully! OPROX Studio Link ID: ${d.studioProjectId}`
        );
        syncWorkspaceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchProjectConcepts = async (projectId: string) => {
    setActiveProjectId(projectId);
    try {
      const res = await fetch(`/api/real-estate/design-projects/${projectId}/concepts`);
      if (res.ok) {
        const d = await res.json();
        setSelectedProjectConcepts(d.concepts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunComparison = async () => {
    if (selectedForCompare.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/real-estate/investment-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisIds: selectedForCompare }),
      });
      if (res.ok) {
        const d = await res.json();
        setCompareResult(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAiAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiAdvisorPrompt) return;
    setLoading(true);
    try {
      const res = await fetch('/api/real-estate/ai/investment-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiAdvisorPrompt,
          analysisIds: selectedForCompare.length > 0 ? selectedForCompare : undefined,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setAiAdvisorResult(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* HEADER & SUITE BAR */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h2 className="text-xl font-black text-white tracking-tight">
              {isRtl ? 'جناح الذكاء الاصطناعي للهندسة والاستثمار العقاري (المرجلة 5)' : 'AI Architectural & Investment Intelligence Suite (Phase 5)'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isRtl
              ? 'تخطيط معماري ذكي، تصميم داخلي وخارجي، مستشار الترميم، ومحرك العوائد الاستثمارية (SAR)'
              : 'Autonomous spatial layout generation, interior/exterior styling, renovation advisory, and grounded SAR yield calculators.'}
          </p>
        </div>

        {/* Currency & Language Controls */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-300 font-bold">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>Currency: SAR (ريال سعودي)</span>
          </div>

          <button
            onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}
            className="px-4 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'EN' ? 'العربية (RTL)' : 'English (LTR)'}</span>
          </button>
        </div>
      </div>

      {/* PHASE 5 SUB-NAV TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('aiArchitect')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'aiArchitect'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>{isRtl ? 'المعمار الذكي' : 'AI Architect'}</span>
        </button>

        <button
          onClick={() => setActiveTab('interiorStudio')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'interiorStudio'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>{isRtl ? 'التصميم الداخلي' : 'AI Interior Studio'}</span>
        </button>

        <button
          onClick={() => setActiveTab('exteriorLandscape')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'exteriorLandscape'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>{isRtl ? 'الواجهات والحدائق' : 'AI Exterior & Landscape'}</span>
        </button>

        <button
          onClick={() => setActiveTab('renovationAdvisor')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'renovationAdvisor'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Hammer className="w-4 h-4" />
          <span>{isRtl ? 'مستشار الترميم' : 'AI Renovation Advisor'}</span>
        </button>

        <button
          onClick={() => setActiveTab('designProjects')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'designProjects'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>{isRtl ? 'مشاريع التصميم & Studio' : 'Design Projects Workspace'}</span>
        </button>

        <button
          onClick={() => setActiveTab('investmentIntelligence')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'investmentIntelligence'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{isRtl ? 'حاسبة العوائد (ROI)' : 'Investment ROI & Yield'}</span>
        </button>

        <button
          onClick={() => setActiveTab('investmentCompare')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'investmentCompare'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>{isRtl ? 'مقارنة الاستثمارات' : 'Investment Comparison'}</span>
        </button>

        <button
          onClick={() => setActiveTab('aiInvestmentAdvisor')}
          className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'aiInvestmentAdvisor'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>{isRtl ? 'المساعد الاستثماري' : 'AI Investment Advisor'}</span>
        </button>
      </div>

      {loading && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-3">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{statusMessage || 'Processing...'}</span>
        </div>
      )}

      {/* ── MODULE 1: AI ARCHITECT ── */}
      {activeTab === 'aiArchitect' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'مدخلات التخطيط المعماري' : 'Architectural Parameters'}</span>
            </h3>

            <form onSubmit={handleGenerateArchitect} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Title</label>
                <input
                  type="text"
                  value={archTitle}
                  onChange={(e) => setArchTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Area (sqm)</label>
                  <input
                    type="number"
                    value={archArea}
                    onChange={(e) => setArchArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={archDimensions}
                    onChange={(e) => setArchDimensions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Style</label>
                <select
                  value={archStyle}
                  onChange={(e) => setArchStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Saudi-inspired">Saudi-inspired / Najdi Modern</option>
                  <option value="Modern">Modern Minimalist</option>
                  <option value="Contemporary">Contemporary Luxury</option>
                  <option value="Islamic-inspired">Islamic Modernist</option>
                  <option value="Classic">Classic Neoclassical</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Room & Spatial Requirements</label>
                <textarea
                  rows={3}
                  value={archRooms}
                  onChange={(e) => setArchRooms(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRtl ? 'توليد المفهوم المعماري' : 'Generate Architectural Concept'}</span>
              </button>
            </form>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? 'نتائج التخطيط المكاني والتوزيع' : 'Generated Concept & Zoning Output'}</span>
              </h3>
              {archResult && (
                <button
                  onClick={() => handleExportToStudio(archResult.project.id)}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Export to OPROX Studio</span>
                </button>
              )}
            </div>

            {/* MANDATORY DISCLAIMER */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                CONCEPTUAL ONLY — THIS AI ARCHITECTURAL DESIGN IS FOR CONCEPTUAL PLANNING AND DOES NOT CONSTITUTE CERTIFIED ENGINEERING OR CONSTRUCTION DRAWINGS. PROFESSIONAL ARCHITECT/ENGINEER STAMP REQUIRED FOR PERMITTING.
              </span>
            </div>

            {archResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="font-bold text-amber-400 text-sm">{archResult.concept.conceptName}</p>
                  <p className="text-slate-300">{archResult.concept.rationale}</p>
                </div>

                {archResult.concept.spacePlanningJson?.functionalZones && (
                  <div className="space-y-2">
                    <p className="font-bold text-white text-xs">Functional Zoning Breakdown:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {archResult.concept.spacePlanningJson.functionalZones.map((zone: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <p className="font-bold text-amber-400">{zone.zoneName}</p>
                          <p className="text-[11px] text-slate-400">Floor: {zone.floor} | Area: {zone.allocatedAreaSqm} sqm</p>
                          <ul className="list-disc list-inside text-[11px] text-slate-300">
                            {zone.features.map((f: string, i: number) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Submit architectural requirements on the left to view AI-generated spatial planning concepts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODULE 2: AI INTERIOR STUDIO ── */}
      {activeTab === 'interiorStudio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'إعدادات الديكور الداخلي' : 'Interior Designer Setup'}</span>
            </h3>

            <form onSubmit={handleGenerateInterior} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Space Type</label>
                <select
                  value={intSpaceType}
                  onChange={(e) => setIntSpaceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="LIVING_ROOM">Living Room & Family Lounge</option>
                  <option value="BEDROOM">Master Bedroom Suite</option>
                  <option value="KITCHEN">Show & Preparation Kitchen</option>
                  <option value="BATHROOM">Luxury Spa Bathroom</option>
                  <option value="OFFICE">Executive Home Office</option>
                  <option value="COMMERCIAL">Commercial Reception / Lounge</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Style Theme</label>
                <select
                  value={intStyle}
                  onChange={(e) => setIntStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Saudi-inspired">Saudi-inspired Warm Modern</option>
                  <option value="Modern">Contemporary Minimalist</option>
                  <option value="Luxury">Luxury Marble & Gold</option>
                  <option value="Classic">Neoclassical Elegance</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                {isRtl ? 'توليد تصميم التصميم الداخلي' : 'Generate Interior Scheme'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'تفاصيل الأثاث والإضاءة والمواد' : 'Generated Interior Palette & Lighting Scheme'}</span>
            </h3>

            {intResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="font-bold text-amber-400">{intResult.concept.conceptName}</p>
                  <p className="text-slate-300">{intResult.concept.rationale}</p>
                </div>

                {intResult.concept.interiorDetailsJson?.colorPalette && (
                  <div className="space-y-2">
                    <p className="font-bold text-white">Color Palette:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {intResult.concept.interiorDetailsJson.colorPalette.map((c: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg border border-slate-700 shrink-0" style={{ backgroundColor: c.hex }} />
                          <div>
                            <p className="font-bold text-white text-[11px]">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.hex} ({c.role})</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Select space type and style theme to generate AI interior recommendations.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODULE 3: AI EXTERIOR & LANDSCAPE ── */}
      {activeTab === 'exteriorLandscape' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'إعدادات الواجهات والحدائق' : 'Exterior & Landscape Input'}</span>
            </h3>

            <form onSubmit={handleGenerateExterior} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facade Style</label>
                <select
                  value={extStyle}
                  onChange={(e) => setExtStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Saudi-inspired">Saudi Stone & Louver Modern</option>
                  <option value="Modern">Minimal Glass & Cantilever</option>
                  <option value="Luxury">Grand Marble Facade</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extPool}
                    onChange={(e) => setExtPool(e.target.checked)}
                    className="rounded border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Pool Feature</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extGarden}
                    onChange={(e) => setExtGarden(e.target.checked)}
                    className="rounded border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Xeriscape Garden</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                {isRtl ? 'توليد تصميم الواجهات' : 'Generate Exterior Concept'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'مخطط الواجهات والمساحات الخارجية' : 'Generated Facade & Landscape Concept'}</span>
            </h3>

            {extResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="font-bold text-amber-400">{extResult.concept.conceptName}</p>
                  <p className="text-slate-300">{extResult.concept.rationale}</p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Configure exterior style preferences to generate landscaping and facade concepts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODULE 6: RENOVATION ADVISOR ── */}
      {activeTab === 'renovationAdvisor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Hammer className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'مدخلات حساب الترميم' : 'Renovation Parameters'}</span>
            </h3>

            <form onSubmit={handleGenerateRenovation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Area (sqm)</label>
                  <input
                    type="number"
                    value={renArea}
                    onChange={(e) => setRenArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Property Age (Years)</label>
                  <input
                    type="number"
                    value={renAge}
                    onChange={(e) => setRenAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Condition</label>
                <select
                  value={renCondition}
                  onChange={(e) => setRenCondition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="POOR">Poor (Requires MEP & Structural Overhaul)</option>
                  <option value="FAIR">Fair (Functional, Needs Modernization)</option>
                  <option value="GOOD">Good (Cosmetic Touch-ups Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Renovation Scope</label>
                <select
                  value={renScope}
                  onChange={(e) => setRenScope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="COSMETIC">Cosmetic (Paint, Lighting, Fixtures)</option>
                  <option value="FULL_INTERIOR">Full Interior Overhaul</option>
                  <option value="FACADE_AND_INTERIOR">Facade & Interior Overhaul</option>
                  <option value="STRUCTURAL_EXPANSION">Structural Expansion / Annex</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                {isRtl ? 'حساب ميزانية وخطة الترميم' : 'Calculate Renovation Roadmap'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Hammer className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'خطة الترميم وتقدير زيادة القيمة' : 'Renovation Roadmap & Value Uplift Estimate'}</span>
            </h3>

            {/* MANDATORY RENOVATION NOTICE */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                ESTIMATE ONLY — ALL RENOVATION COST AND VALUE UPLIFT FIGURES ARE ESTIMATED STATISTICAL RANGES AND DO NOT CONSTITUTE A BINDING CONTRACTOR BIDO OR CERTIFIED APPRAISAL.
              </span>
            </div>

            {renResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-semibold text-[11px]">Estimated Budget Min</p>
                    <p className="text-lg font-black text-amber-400">
                      SAR {renResult.concept.renovationDetailsJson.estimatedBudgetRangeSar.minSar.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-semibold text-[11px]">Estimated Budget Max</p>
                    <p className="text-lg font-black text-amber-400">
                      SAR {renResult.concept.renovationDetailsJson.estimatedBudgetRangeSar.maxSar.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 col-span-2 md:col-span-1">
                    <p className="text-slate-400 font-semibold text-[11px]">Est. Value Uplift</p>
                    <p className="text-lg font-black text-emerald-400">
                      +SAR {renResult.concept.renovationDetailsJson.valueImprovementScenario.estimatedPostRenovationValueUpliftSar.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white">Suggested Renovation Phases:</p>
                  {renResult.concept.renovationDetailsJson.suggestedPhases.map((phase: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <p className="font-bold text-amber-400">{phase.phase} ({phase.priority})</p>
                      <ul className="list-disc list-inside text-[11px] text-slate-300">
                        {phase.tasks.map((t: string, idx: number) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Submit property details to generate estimated renovation costs and value boost scenario.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODULE 4 & 5: DESIGN PROJECTS WORKSPACE & STUDIO EXPORT ── */}
      {activeTab === 'designProjects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'مشاريع التصميم المحفوظة' : 'Design Projects Directory'}</span>
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {designProjects.length === 0 ? (
                <p className="text-slate-500 py-4 text-center">No saved design projects yet.</p>
              ) : (
                designProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleFetchProjectConcepts(p.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                      activeProjectId === p.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white text-xs">{p.title}</p>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] text-amber-400 font-semibold">{p.projectType}</span>
                    </div>
                    {p.studioProjectId && (
                      <p className="text-[10px] text-emerald-400 font-mono">Studio Linked: {p.studioProjectId}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? 'نسخ المفهوم والربط مع OPROX Studio' : 'Concept Version History & OPROX Studio Link'}</span>
              </h3>
              {activeProjectId && (
                <button
                  onClick={() => handleExportToStudio(activeProjectId)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Export to Studio Boundary</span>
                </button>
              )}
            </div>

            {selectedProjectConcepts.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                Select a design project from the left panel to inspect its version history and export to OPROX Studio.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedProjectConcepts.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-amber-400 text-xs">{c.conceptName} (v{c.versionNumber})</p>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        {c.approvalStatus}
                      </span>
                    </div>
                    <p className="text-slate-300">{c.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODULE 7: INVESTMENT ROI & YIELD CALCULATOR ── */}
      {activeTab === 'investmentIntelligence' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'مدخلات الاستثمار المالي' : 'Investment Analysis Parameters'}</span>
            </h3>

            <form onSubmit={handleCalculateInvestment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Property Title</label>
                <input
                  type="text"
                  value={invTitle}
                  onChange={(e) => setInvTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Purchase Price (SAR)</label>
                  <input
                    type="number"
                    value={invPrice}
                    onChange={(e) => setInvPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Area (sqm)</label>
                  <input
                    type="number"
                    value={invArea}
                    onChange={(e) => setInvArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Est. Annual Rent (SAR)</label>
                  <input
                    type="number"
                    value={invRent}
                    onChange={(e) => setInvRent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Operating Expenses (SAR)</label>
                  <input
                    type="number"
                    value={invExpenses}
                    onChange={(e) => setInvExpenses(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Financing (%)</label>
                  <input
                    type="number"
                    value={invFinancingPct}
                    onChange={(e) => setInvFinancingPct(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mortgage Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={invInterestRate}
                    onChange={(e) => setInvInterestRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                {isRtl ? 'حساب مؤشرات الاستثمار (SAR)' : 'Calculate Investment Metrics'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'مؤشرات العوائد والتدفق النقدي والتوقعات' : 'Yield, Cash Flow & 5-Year Scenario Forecast'}</span>
            </h3>

            {invResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold">Gross Yield</p>
                    <p className="text-xl font-black text-amber-400">{invResult.calculatedMetricsJson.grossYieldPct}%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold">Net Cap Rate</p>
                    <p className="text-xl font-black text-emerald-400">{invResult.calculatedMetricsJson.netYieldPct}%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold">Cash-on-Cash Return</p>
                    <p className="text-xl font-black text-cyan-400">{invResult.calculatedMetricsJson.cashFlowDetails.cashOnCashReturnPct}%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold">Price / Sqm</p>
                    <p className="text-xl font-black text-white">SAR {invResult.calculatedMetricsJson.pricePerSqmSar}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <p className="font-bold text-amber-400 text-xs">Annual Net Operating Income (NOI):</p>
                  <p className="text-sm font-extrabold text-white">
                    SAR {invResult.calculatedMetricsJson.netOperatingIncomeSar.toLocaleString()} / year
                  </p>
                </div>

                {invResult.calculatedMetricsJson.fiveYearScenarioForecast && (
                  <div className="space-y-2">
                    <p className="font-bold text-white">5-Year Capital & Rental Growth Forecast:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-semibold">
                            <th className="py-2 px-3">Year</th>
                            <th className="py-2 px-3">Est. Property Value</th>
                            <th className="py-2 px-3">Annual Rent</th>
                            <th className="py-2 px-3">Cumulative Cash Flow</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-[11px] text-slate-300">
                          {invResult.calculatedMetricsJson.fiveYearScenarioForecast.map((f: any) => (
                            <tr key={f.year}>
                              <td className="py-2 px-3 font-bold text-amber-400">Year {f.year}</td>
                              <td className="py-2 px-3 font-mono">SAR {f.estimatedPropertyValueSar.toLocaleString()}</td>
                              <td className="py-2 px-3 font-mono">SAR {f.annualRentSar.toLocaleString()}</td>
                              <td className="py-2 px-3 font-mono text-emerald-400">SAR {f.cumulativeCashFlowSar.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Submit property investment details to generate ROI, Cap Rate, and 5-Year forecasts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODULE 7: INVESTMENT COMPARISON MATRIX ── */}
      {activeTab === 'investmentCompare' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? 'مقارنة الفرص الاستثمارية جنباً إلى جنب' : 'Side-by-Side Investment Comparison Matrix'}</span>
              </h3>
              <p className="text-slate-400 text-[11px]">Select 2 or more investment records to compare cap rates and ratings.</p>
            </div>

            <button
              onClick={handleRunComparison}
              disabled={selectedForCompare.length < 1 || loading}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              Compare Selected ({selectedForCompare.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {investmentList.map((item) => {
              const isSelected = selectedForCompare.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedForCompare(selectedForCompare.filter((id) => id !== item.id));
                    } else {
                      setSelectedForCompare([...selectedForCompare, item.id]);
                    }
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">{item.title}</p>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded border-slate-800 text-amber-500 focus:ring-0"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">SAR {Number(item.purchasePriceSar).toLocaleString()}</p>
                </div>
              );
            })}
          </div>

          {compareResult && (
            <div className="overflow-x-auto pt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-semibold">
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Purchase Price</th>
                    <th className="py-3 px-4">Gross Yield</th>
                    <th className="py-3 px-4">Net Cap Rate</th>
                    <th className="py-3 px-4">Cash-on-Cash Return</th>
                    <th className="py-3 px-4">Data Quality</th>
                    <th className="py-3 px-4">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[11px]">
                  {compareResult.comparisonMatrix.map((c: any) => (
                    <tr key={c.analysisId}>
                      <td className="py-3 px-4 font-bold text-white">{c.title}</td>
                      <td className="py-3 px-4 font-mono">SAR {c.purchasePriceSar.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-amber-400">{c.grossYieldPct}%</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{c.netYieldPct}%</td>
                      <td className="py-3 px-4 font-mono text-cyan-400">{c.cashOnCashReturnPct}%</td>
                      <td className="py-3 px-4 text-slate-400">{c.dataQualityStatus}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            c.investmentRating === 'STRONG_BUY'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : c.investmentRating === 'SPECULATIVE'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {c.investmentRating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODULE 8: AI INVESTMENT ADVISOR COPILOT ── */}
      {activeTab === 'aiInvestmentAdvisor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'المساعد الاستثماري الذكي' : 'AI Investment Copilot'}</span>
            </h3>

            <form onSubmit={handleAskAiAdvisor} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Investment Question</label>
                <textarea
                  rows={4}
                  value={aiAdvisorPrompt}
                  onChange={(e) => setAiAdvisorPrompt(e.target.value)}
                  placeholder="e.g., What happens if rent drops by 10% on my primary villa investment?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400">Quick Shortcuts:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAiAdvisorPrompt('What if rent drops by 10%?')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800"
                  >
                    -10% Rent Drop Sensitivity
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiAdvisorPrompt('Compare yields for my properties')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800"
                  >
                    Compare Property Yields
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                {isRtl ? 'استشارة الذكاء الاصطناعي' : 'Ask AI Investment Copilot'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'الإجابة القائمة على البيانات الحقيقية' : 'Grounded Investment Guidance'}</span>
            </h3>

            {aiAdvisorResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {aiAdvisorResult.answer}
                </div>

                {aiAdvisorResult.sensitivityScenarios && aiAdvisorResult.sensitivityScenarios.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-bold text-white">Sensitivity Scenarios:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {aiAdvisorResult.sensitivityScenarios.map((s: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <p className="font-bold text-amber-400 text-xs">{s.scenario}</p>
                          <p className="text-[11px] text-slate-300">Net Cap Rate: {s.projectedNetYieldPct}%</p>
                          <p className="text-[11px] text-slate-400 font-mono">Cash Flow: SAR {s.annualCashFlowSar.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Ask a question to receive grounded AI investment guidance and sensitivity analysis.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
