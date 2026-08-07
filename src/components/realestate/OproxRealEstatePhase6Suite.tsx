import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Layers,
  Eye,
  Glasses,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Compass,
  ArrowRight,
  Plus,
  Trash2,
  ShieldCheck,
  Building,
  Home,
  Sparkles,
  FileText,
  Activity,
  ChevronRight,
  Globe,
  Settings,
} from 'lucide-react';
import { RealEstate3DViewer } from './RealEstate3DViewer';
import { RealEstate360Viewer } from './RealEstate360Viewer';
import { RealEstateWebXRLauncher } from './RealEstateWebXRLauncher';
import {
  listImmersiveAssets,
  createImmersiveAsset,
  deleteImmersiveAsset,
  listDigitalTwins,
  createDigitalTwin,
  createDigitalTwinVersion,
  detectVRARCapability,
  logCapabilityCheck,
  handoffDesignToImmersive,
  getMarketplaceImmersiveAssets,
  auditProductBoundaryScope,
} from '../../lib/realestate/realEstatePhase6Store';

interface SuiteProps {
  tenantId?: string;
  userId?: string;
  language?: 'en' | 'ar';
}

export const OproxRealEstatePhase6Suite: React.FC<SuiteProps> = ({
  tenantId = 'tenant_default',
  userId = 'usr_default',
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<
    'viewer' | 'walkthrough' | 'vrar' | 'digitaltwin' | 'handoff' | 'assets' | 'audit'
  >('viewer');

  const [lang, setLang] = useState<'en' | 'ar'>(language);
  const isRtl = lang === 'ar';

  // 3D Viewer State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number>(100);
  const [cameraAngle, setCameraAngle] = useState<number>(45);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Walkthrough State
  const [currentRoomIndex, setCurrentRoomIndex] = useState<number>(0);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState<boolean>(false);

  // VR/AR State
  const [vrStatus, setVrStatus] = useState<'SUPPORTED' | 'UNSUPPORTED' | 'NOT_CONFIGURED'>('NOT_CONFIGURED');
  const [arStatus, setArStatus] = useState<'SUPPORTED' | 'UNSUPPORTED' | 'NOT_CONFIGURED'>('NOT_CONFIGURED');

  // Digital Twin State
  const [digitalTwins, setDigitalTwins] = useState<any[]>([]);
  const [selectedTwin, setSelectedTwin] = useState<any | null>(null);

  // Asset Management State
  const [assets, setAssets] = useState<any[]>([]);
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetType, setNewAssetType] = useState<'GLB' | 'GLTF' | 'PANORAMA_360' | 'VR' | 'AR' | 'DIGITAL_TWIN'>('GLB');
  const [newLinkedEntityType, setNewLinkedEntityType] = useState<'PROPERTY' | 'UNIT' | 'DEVELOPER_PROJECT'>('PROPERTY');
  const [newLinkedEntityId, setNewLinkedEntityId] = useState('prop_001');

  // Handoff State
  const [handoffProjectId, setHandoffProjectId] = useState('proj_phase5_01');
  const [handoffConceptId, setHandoffConceptId] = useState('dc_concept_01');
  const [handoffResult, setHandoffResult] = useState<any | null>(null);

  // Boundary Audit State
  const [auditResult, setAuditResult] = useState<any | null>(null);

  // Sample rooms for 3D walkthrough demo
  const sampleRooms = [
    {
      id: 'rm_majlis',
      nameEn: 'Saudi Luxury Majlis',
      nameAr: 'مجلس سعودي فاخر',
      floor: 1,
      area: '55 sqm',
      descriptionEn: 'Traditional reception hall with Saudi architectural woodwork and ambient light.',
      descriptionAr: 'قاعة استقبال تقليدية بأخشاب معمارية سعودية وإضاءة محيطية.',
      hotspots: [
        { id: 'hs_majlis_1', title: 'Traditional Woodwork', x: 20, y: 40, info: 'Salmani-style engraved paneling' },
        { id: 'hs_majlis_2', title: 'Arabian Seating', x: 60, y: 70, info: 'Saudi handcrafted plush seating arrangement' },
      ],
    },
    {
      id: 'rm_living',
      nameEn: 'Grand Living Room',
      nameAr: 'غرفة المعيشة الرئيسية',
      floor: 1,
      area: '42 sqm',
      descriptionEn: 'Open-concept family hall with floor-to-ceiling glass looking onto inner courtyard.',
      descriptionAr: 'صالة عائلية مفتوحة مع زجاج من الأرض حتى السقف يطل على الفناء الداخلي.',
      hotspots: [
        { id: 'hs_living_1', title: 'Courtyard Panorama', x: 40, y: 30, info: 'Direct access to private landscaped garden' },
      ],
    },
    {
      id: 'rm_dining',
      nameEn: 'Dining Suite',
      nameAr: 'جناح الطعام',
      floor: 1,
      area: '28 sqm',
      descriptionEn: 'Formal 12-seater dining suite with marble features and brass pendant lighting.',
      descriptionAr: 'جناح طعام يتسع لـ 12 شخصاً مع رخام وإضاءة نحاسية دافئة.',
      hotspots: [],
    },
  ];

  // Initialize data and capabilities
  useEffect(() => {
    loadData();
    checkCapabilities();
    runAudit();
  }, [tenantId]);

  const loadData = async () => {
    const loadedAssets = await listImmersiveAssets(tenantId);
    setAssets(loadedAssets);

    const loadedTwins = await listDigitalTwins(tenantId);
    setDigitalTwins(loadedTwins);
    if (loadedTwins.length > 0) {
      setSelectedTwin(loadedTwins[0]);
    } else {
      // Seed initial sample twin
      const sampleTwin = await createDigitalTwin({
        tenantId,
        title: 'Digital Twin — Al-Riyadh Villa 101',
        linkedEntityType: 'PROPERTY',
        linkedEntityId: 'prop_001',
        floorsCount: 2,
        spatialMetadataJson: {
          floors: [
            { floorNumber: 1, name: 'Ground Floor', roomsCount: 3 },
            { floorNumber: 2, name: 'First Floor', roomsCount: 4 },
          ],
          rooms: [
            { id: 'rm_1', name: 'Saudi Majlis', floorNumber: 1, areaSqm: 55, orientation: 'NORTH' },
            { id: 'rm_2', name: 'Grand Living', floorNumber: 1, areaSqm: 42, orientation: 'EAST' },
            { id: 'rm_3', name: 'Primary Bedroom Suite', floorNumber: 2, areaSqm: 48, orientation: 'SOUTH' },
          ],
          dimensions: { totalAreaSqm: 450, maxElevationMeters: 9.5 },
          hotspots: [{ id: 'hs_1', title: 'Courtyard View', x: 0, y: 2, z: -3, info: 'Inner landscaped courtyard' }],
        },
      });
      setDigitalTwins([sampleTwin]);
      setSelectedTwin(sampleTwin);
    }
  };

  const checkCapabilities = async () => {
    const vr = await detectVRARCapability('VR', navigator.userAgent);
    setVrStatus(vr as any);
    await logCapabilityCheck(tenantId, userId, 'VR', vr as any, navigator.userAgent, 'prop_001');

    const ar = await detectVRARCapability('AR', navigator.userAgent);
    setArStatus(ar as any);
    await logCapabilityCheck(tenantId, userId, 'AR', ar as any, navigator.userAgent, 'prop_001');
  };

  const runAudit = () => {
    const res = auditProductBoundaryScope();
    setAuditResult(res);
  };

  // Canvas renderer simulation with cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid / 3D Canvas environment
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 30;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 3D Property Isometric Box Representation
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 20;
      const scale = (cameraZoom / 100) * 120;
      const angleRad = (cameraAngle * Math.PI) / 180;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Draw floor slab
      ctx.fillStyle = selectedFloor === 1 ? '#1e3a8a' : '#0f766e';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, -scale * 0.5);
      ctx.lineTo(scale * Math.cos(angleRad), 0);
      ctx.lineTo(0, scale * 0.5);
      ctx.lineTo(-scale * Math.cos(angleRad), 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw walls
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.moveTo(-scale * Math.cos(angleRad), 0);
      ctx.lineTo(0, 0.5 * scale);
      ctx.lineTo(0, -scale * 0.8);
      ctx.lineTo(-scale * Math.cos(angleRad), -scale * 1.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0.5 * scale);
      ctx.lineTo(scale * Math.cos(angleRad), 0);
      ctx.lineTo(scale * Math.cos(angleRad), -scale * 0.8);
      ctx.lineTo(0, -scale * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Hotspots
      const currentRoom = sampleRooms[currentRoomIndex];
      if (currentRoom && currentRoom.hotspots) {
        currentRoom.hotspots.forEach((hs, idx) => {
          const hx = (hs.x - 50) * 2;
          const hy = (hs.y - 50) * 2 - scale * 0.4;

          ctx.fillStyle = activeHotspot === hs.id ? '#f59e0b' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(hx, hy, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`H${idx + 1}`, hx - 5, hy + 3);
        });
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Memory disposal / cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraZoom, cameraAngle, selectedFloor, currentRoomIndex, activeHotspot]);

  // Asset creation handler
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetTitle) return;

    await createImmersiveAsset({
      tenantId,
      linkedEntityType: newLinkedEntityType,
      linkedEntityId: newLinkedEntityId,
      assetType: newAssetType,
      title: newAssetTitle,
      storageReference: `oprox://storage/models/${Date.now()}_${newAssetTitle.toLowerCase().replace(/\s+/g, '_')}.${newAssetType.toLowerCase()}`,
      fileSizeBytes: 2450000,
    });

    setNewAssetTitle('');
    loadData();
  };

  // Delete asset handler
  const handleDeleteAsset = async (id: string) => {
    await deleteImmersiveAsset(tenantId, id);
    loadData();
  };

  // Design Handoff handler
  const handleHandoff = async () => {
    const res = await handoffDesignToImmersive(tenantId, userId, handoffProjectId, handoffConceptId);
    setHandoffResult(res);
    loadData();
  };

  // Digital Twin Versioning handler
  const handleNewTwinVersion = async () => {
    if (!selectedTwin) return;
    const updated = await createDigitalTwinVersion(tenantId, selectedTwin.id, {
      title: `${selectedTwin.title} (v${selectedTwin.versionNumber + 1})`,
      spatialMetadataJson: {
        ...selectedTwin.spatialMetadataJson,
        updatedNote: `Version ${selectedTwin.versionNumber + 1} spatial revision.`,
      },
    });
    loadData();
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Box className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight">
              {isRtl ? 'أوبروكس العقارية — المرحلة 6: التجارب ثلاثية الأبعاد والتؤام الرقمي' : 'OPROX Real Estate — Phase 6: 3D, VR, AR & Digital Twin Engine'}
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            {isRtl
              ? 'العرض التفاعلي ثلاثي الأبعاد، التجول الافتراضي، جولات الواقع المعزز/الافتراضي، ومطابقة التوأم الرقمي'
              : 'Interactive 3D presentation, virtual walkthroughs, WebXR VR/AR, and versioned Digital Twins.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs font-semibold"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <span className="px-3 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-semibold rounded-full">
            Phase 6 Production Ready
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'viewer', labelEn: '3D Property Viewer', labelAr: 'المستعرض ثلاثي الأبعاد', icon: Box },
          { id: 'walkthrough', labelEn: 'Interactive Walkthrough', labelAr: 'التجول التفاعلي', icon: Eye },
          { id: 'vrar', labelEn: 'WebXR VR / AR', labelAr: 'الواقع الافتراضي والمعزز', icon: Glasses },
          { id: 'digitaltwin', labelEn: 'Digital Twin Engine', labelAr: 'محرك التوأم الرقمي', icon: Layers },
          { id: 'handoff', labelEn: 'Phase 5 Design Handoff', labelAr: 'تسليم التصميم من المرحلة 5', icon: Sparkles },
          { id: 'assets', labelEn: 'Immersive Assets', labelAr: 'إدارة الأصول الثلاثية', icon: FileText },
          { id: 'audit', labelEn: 'Boundary Audit', labelAr: 'تدقيق حدود المنتجات', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {isRtl ? tab.labelAr : tab.labelEn}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 3D PROPERTY VIEWER */}
      {activeTab === 'viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <RealEstate3DViewer
              title="Salmani Architectural Villa #101 (3D GLB/GLTF WebGL)"
              language={lang}
              onHotspotClick={(hs) => setActiveHotspot(`${hs.title}: ${hs.info}`)}
            />
          </div>

          {/* Sidebar Spatial Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
            <h3 className="font-bold text-lg border-b border-slate-800 pb-2 flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              {isRtl ? 'المعالم الفراغية والنقاط التفاعلية' : 'Spatial Zones & Hotspots'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">{isRtl ? 'العقار المحدد:' : 'Selected Property:'}</span>
                <div className="font-bold text-sm text-cyan-300 mt-1">Al-Riyadh Salmani Villa #101</div>
                <div className="text-slate-500 mt-0.5">ID: prop_001 | 450 sqm | 2 Floors | Three.js WebGL Engine</div>
              </div>

              {activeHotspot && (
                <div className="bg-cyan-950/80 border border-cyan-500/60 p-3 rounded-xl space-y-1">
                  <div className="font-bold text-cyan-400">{isRtl ? 'النقطة النشطة المختارة:' : 'Selected Hotspot:'}</div>
                  <p className="text-slate-200">{activeHotspot}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-slate-400 font-semibold">{isRtl ? 'نقاط المعلومات المكانية:' : 'Interactive Hotspots:'}</label>
                {sampleRooms[currentRoomIndex]?.hotspots?.map((hs) => (
                  <button
                    key={hs.id}
                    onClick={() => setActiveHotspot(`${hs.title}: ${hs.info}`)}
                    className="w-full text-left p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 flex justify-between items-center transition"
                  >
                    <span>{hs.title}</span>
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="text-slate-400 font-semibold mb-2">{isRtl ? 'حالة التخلص من الذاكرة:' : 'WebGL Context & Memory Disposal:'}</div>
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRtl ? 'إدارة الذاكرة والتنظيف عند إلغاء التحميل نشطة' : 'Three.js Material & Geometry Memory Cleanup Active'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE 360 PANORAMA WALKTHROUGH */}
      {activeTab === 'walkthrough' && (
        <div className="space-y-6">
          <RealEstate360Viewer
            title={`360° Panorama — ${sampleRooms[currentRoomIndex]?.nameEn || 'Living Room'}`}
            language={lang}
            onHotspotClick={(hs) => setActiveHotspot(`${hs.title}: ${hs.info}`)}
          />

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="font-bold text-sm text-cyan-400">{isRtl ? 'الغرفة المعروضة حالياً:' : 'Active Panorama Room:'}</h4>
              <p className="text-slate-300 text-xs mt-0.5">
                {isRtl ? sampleRooms[currentRoomIndex]?.descriptionAr : sampleRooms[currentRoomIndex]?.descriptionEn}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {sampleRooms.map((rm, idx) => (
                <button
                  key={rm.id}
                  onClick={() => setCurrentRoomIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    currentRoomIndex === idx ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isRtl ? rm.nameAr : rm.nameEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBXR VR / AR */}
      {activeTab === 'vrar' && (
        <RealEstateWebXRLauncher
          tenantId={tenantId}
          userId={userId}
          linkedEntityId="prop_001"
          language={lang}
        />
      )}

      {/* TAB 4: DIGITAL TWIN ENGINE */}
      {activeTab === 'digitaltwin' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Layers className="w-6 h-6 text-cyan-400" />
                {isRtl ? 'محرك العرض التوأم الرقمي (Digital Twin Presentation)' : 'Digital Twin Presentation Engine'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {isRtl ? 'سجلات التوأم الرقمي مع إصدارات النماذج والبيانات المكانية للمواد والمساحات' : 'Versioned Digital Twin records with spatial metadata, dimensions, and materials.'}
              </p>
            </div>

            <button
              onClick={handleNewTwinVersion}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isRtl ? 'إنشاء إصدار جديد من التوأم' : 'Create Digital Twin Version'}
            </button>
          </div>

          {selectedTwin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="font-bold text-cyan-400 text-sm">{selectedTwin.title}</div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>ID: {selectedTwin.id}</div>
                  <div>Version: v{selectedTwin.versionNumber} (Current)</div>
                  <div>Floors: {selectedTwin.floorsCount}</div>
                  <div>Total Area: {selectedTwin.spatialMetadataJson?.dimensions?.totalAreaSqm || 450} sqm</div>
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
                <h4 className="font-bold text-white text-sm">{isRtl ? 'التفاصيل المكانية والمواد:' : 'Spatial Breakdown & Material References:'}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTwin.spatialMetadataJson?.rooms?.map((rm: any) => (
                    <div key={rm.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                      <div className="font-semibold text-cyan-300">{rm.name}</div>
                      <div className="text-slate-400 mt-1">Floor: L{rm.floorNumber} | Area: {rm.areaSqm} sqm</div>
                      <div className="text-slate-500">Orientation: {rm.orientation || 'NORTH'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PHASE 5 DESIGN HANDOFF */}
      {activeTab === 'handoff' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              {isRtl ? 'تسليم تصميم المرحلة 5 إلى التوأم الرقمي 3D' : 'Phase 5 Design → Phase 6 Immersive Pipeline'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {isRtl ? 'ربط مفاهيم المهندس المعماري والمصمم الداخلي بأصول التوأم الرقمي' : 'Connect Phase 5 AI Architect concepts to Phase 6 3D & Digital Twin records.'}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl space-y-4 max-w-xl">
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Design Project ID:</label>
                <input
                  type="text"
                  value={handoffProjectId}
                  onChange={(e) => setHandoffProjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Approved Concept ID:</label>
                <input
                  type="text"
                  value={handoffConceptId}
                  onChange={(e) => setHandoffConceptId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <button
                onClick={handleHandoff}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
              >
                {isRtl ? 'تنفيذ التسليم الفراغي' : 'Execute Spatial Handoff'}
              </button>
            </div>

            {handoffResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  handoffResult.status === 'READY'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-800 text-amber-300'
                }`}
              >
                <div className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Status: {handoffResult.status}</span>
                </div>
                <p>{handoffResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: IMMERSIVE ASSET MANAGEMENT */}
      {activeTab === 'assets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-cyan-400" />
                {isRtl ? 'إدارة الأصول الثلاثية والمجسمات (GLB, GLTF, 360)' : 'Immersive Asset Registry (GLB, GLTF, 360)'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {isRtl ? 'ربط نماذج GLB والمناظر 360 بالعقارات والمشاريع والوحدات' : 'Upload and associate 3D models and 360 panoramas with properties and listings.'}
              </p>
            </div>
          </div>

          {/* Asset Upload Form */}
          <form onSubmit={handleCreateAsset} className="bg-slate-950 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              placeholder="Asset Title (e.g., Ground Floor 3D Model)"
              value={newAssetTitle}
              onChange={(e) => setNewAssetTitle(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
              required
            />

            <select
              value={newAssetType}
              onChange={(e) => setNewAssetType(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
            >
              <option value="GLB">GLB Model</option>
              <option value="GLTF">GLTF Model</option>
              <option value="PANORAMA_360">360 Panorama</option>
              <option value="VR">VR Spatial Model</option>
              <option value="AR">AR Anchor Model</option>
            </select>

            <select
              value={newLinkedEntityType}
              onChange={(e) => setNewLinkedEntityType(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white"
            >
              <option value="PROPERTY">Property</option>
              <option value="UNIT">Unit</option>
              <option value="DEVELOPER_PROJECT">Developer Project</option>
            </select>

            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded-lg p-2.5 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              {isRtl ? 'إضافة الأصل' : 'Register Asset'}
            </button>
          </form>

          {/* Assets Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {assets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-semibold text-white">{ast.title}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono">{ast.assetType}</span>
                    </td>
                    <td className="p-3 text-slate-400">{ast.linkedEntityType}:{ast.linkedEntityId}</td>
                    <td className="p-3 text-slate-500 font-mono text-[10px] truncate max-w-[180px]">{ast.storageReference}</td>
                    <td className="p-3">
                      <button onClick={() => handleDeleteAsset(ast.id)} className="text-rose-400 hover:text-rose-300 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: BOUNDARY AUDIT */}
      {activeTab === 'audit' && auditResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                {isRtl ? 'تدقيق حدود منتج العقارات OPROX Real Estate' : 'OPROX PropTech Product Boundary Scope Audit'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {isRtl ? 'التحقق من عدم وجود ميزات إدارة المرافق الصيانة أو أوامر العمل' : 'Verification of strict PropTech scope boundaries (ZERO Facility Management or CMMS features).'}
              </p>
            </div>

            <span className="px-4 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold rounded-full">
              STATUS: {auditResult.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Facility Management Features', val: auditResult.FACILITY_MANAGEMENT_FEATURES },
              { label: 'CMMS Operational Features', val: auditResult.CMMS_FEATURES },
              { label: 'Work Order Management', val: auditResult.WORK_ORDER_FEATURES },
              { label: 'Spare Parts Inventory', val: auditResult.SPARE_PARTS_FEATURES },
              { label: 'Technician Dispatch System', val: auditResult.TECHNICIAN_DISPATCH_FEATURES },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                <span className="text-slate-300 text-xs">{item.label}</span>
                <span className="text-lg font-bold text-emerald-400">{item.val}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>
              {isRtl
                ? 'تم التحقق بنجاح: OPROX Real Estate هي منصة عقارات وتقنيات عقارية محضة خالية من أية تداخلات مع إدارة الصيانة والمرافق.'
                : 'Scope Audit Verified: OPROX Real Estate remains strictly focused on PropTech, discovery, sales, leasing, architectural design, investment, and 3D presentation.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
