import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Box,
  Layers,
  Info,
  AlertTriangle,
  Loader2,
  Sun,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface Hotspot3D {
  id: string;
  title: string;
  info: string;
  position: [number, number, number];
  floor?: number;
}

interface RealEstate3DViewerProps {
  modelUrl?: string;
  title?: string;
  assetType?: 'GLB' | 'GLTF' | 'PANORAMA_360' | 'VR' | 'AR' | 'DIGITAL_TWIN';
  selectedFloor?: number;
  selectedZone?: string;
  hotspots?: Hotspot3D[];
  onHotspotClick?: (hotspot: Hotspot3D) => void;
  language?: 'en' | 'ar';
}

export const RealEstate3DViewer: React.FC<RealEstate3DViewerProps> = ({
  modelUrl,
  title,
  assetType = 'GLB',
  selectedFloor = 1,
  selectedZone = 'all',
  hotspots = [
    { id: 'hs_majlis', title: 'Salmani Majlis', info: 'Saudi handcrafted reception hall with Salmani engravings', position: [-2, 1.2, 1.5], floor: 1 },
    { id: 'hs_courtyard', title: 'Inner Courtyard', info: 'Landscaped private courtyard with water fountain feature', position: [0, 0.8, -1], floor: 1 },
    { id: 'hs_master_suite', title: 'Primary Bedroom Suite', info: 'Upper floor master suite with terrace overlooking garden', position: [1.8, 3.5, 0.5], floor: 2 },
  ],
  onHotspotClick,
  language = 'en',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot3D | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [useFallbackCanvas, setUseFallbackCanvas] = useState<boolean>(false);
  const [renderStats, setRenderStats] = useState<{ triangles: number; fps: number }>({ triangles: 0, fps: 60 });

  const isRtl = language === 'ar';

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    floorGroup1: THREE.Group;
    floorGroup2: THREE.Group;
    modelGroup: THREE.Group;
    hotspotMeshes: THREE.Mesh[];
    animationFrameId: number;
    disposed: boolean;
  } | null>(null);

  // Screen projected hotspot 2D positions for UI overlay
  const [projectedHotspots, setProjectedHotspots] = useState<
    { id: string; title: string; info: string; x: number; y: number; visible: boolean; raw: Hotspot3D }[]
  >([]);

  useEffect(() => {
    if (!mountRef.current) return;

    let isDisposed = false;
    let animId = 0;

    try {
      const width = mountRef.current.clientWidth || 640;
      const height = mountRef.current.clientHeight || 380;

      // 1. Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      scene.fog = new THREE.FogExp2(0x0f172a, 0.03);

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(8, 7, 10);

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Clear existing canvas
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
      mountRef.current.appendChild(renderer.domElement);

      // 4. Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below ground
      controls.minDistance = 2;
      controls.maxDistance = 30;

      // 5. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.6);
      dirLight.position.set(12, 18, 10);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
      fillLight.position.set(-10, 8, -10);
      scene.add(fillLight);

      // Ground plane
      const gridHelper = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
      gridHelper.position.y = -0.01;
      scene.add(gridHelper);

      // Groups for Floor 1 & Floor 2
      const modelGroup = new THREE.Group();
      scene.add(modelGroup);

      const floorGroup1 = new THREE.Group();
      const floorGroup2 = new THREE.Group();
      modelGroup.add(floorGroup1);
      modelGroup.add(floorGroup2);

      // 6. Check if modelUrl is a real HTTP / GLB URL
      const isHttpModel = modelUrl && (modelUrl.startsWith('http://') || modelUrl.startsWith('https://') || modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf'));

      if (isHttpModel) {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (isDisposed) return;
            modelGroup.add(gltf.scene);
            setLoading(false);
          },
          (xhr) => {
            // progress
          },
          (err) => {
            console.warn('GLTF load error, using procedural 3D architectural model:', err);
            buildProceduralBuilding(floorGroup1, floorGroup2);
            setLoading(false);
          }
        );
      } else {
        // Build procedural Salmani Architectural Villa model in Three.js
        buildProceduralBuilding(floorGroup1, floorGroup2);
        setLoading(false);
      }

      // Hotspot 3D indicators
      const hotspotMeshes: THREE.Mesh[] = [];
      hotspots.forEach((hs) => {
        const geo = new THREE.SphereGeometry(0.18, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.6,
          roughness: 0.2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...hs.position);
        mesh.userData = hs;
        modelGroup.add(mesh);
        hotspotMeshes.push(mesh);
      });

      threeRef.current = {
        scene,
        camera,
        renderer,
        controls,
        floorGroup1,
        floorGroup2,
        modelGroup,
        hotspotMeshes,
        animationFrameId: 0,
        disposed: false,
      };

      // 7. Render Loop
      let lastTime = performance.now();
      let frameCount = 0;

      const animate = () => {
        if (isDisposed) return;

        controls.update();
        renderer.render(scene, camera);

        // Update stats
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (now - lastTime));
          const triangles = renderer.info.render.triangles;
          setRenderStats({ triangles, fps });
          frameCount = 0;
          lastTime = now;
        }

        // Project 3D Hotspots to 2D screen positions
        const tempV = new THREE.Vector3();
        const newProjected = hotspots.map((hs) => {
          tempV.set(hs.position[0], hs.position[1], hs.position[2]);
          tempV.project(camera);

          const x = ((tempV.x + 1) * width) / 2;
          const y = ((-tempV.y + 1) * height) / 2;
          const isBehindCamera = tempV.z > 1;

          return {
            id: hs.id,
            title: hs.title,
            info: hs.info,
            x,
            y,
            visible: !isBehindCamera && tempV.x >= -1 && tempV.x <= 1 && tempV.y >= -1 && tempV.y <= 1,
            raw: hs,
          };
        });
        setProjectedHotspots(newProjected);

        animId = requestAnimationFrame(animate);
      };

      animate();

      // Handle Resize
      const handleResize = () => {
        if (!mountRef.current || !threeRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        isDisposed = true;
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);

        // Dispose Three.js resources cleanly
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach((m) => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          }
        });
        renderer.dispose();
        if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };
    } catch (err: any) {
      console.error('WebGL init error:', err);
      setLoadError(err.message || 'WebGL context initialization failed');
      setUseFallbackCanvas(true);
      setLoading(false);
    }
  }, [modelUrl]);

  // Floor visibility toggling
  useEffect(() => {
    if (!threeRef.current) return;
    const { floorGroup1, floorGroup2 } = threeRef.current;
    if (selectedFloor === 1) {
      floorGroup1.visible = true;
      floorGroup2.visible = false;
    } else if (selectedFloor === 2) {
      floorGroup1.visible = true;
      floorGroup2.visible = true;
    } else {
      floorGroup1.visible = true;
      floorGroup2.visible = true;
    }
  }, [selectedFloor]);

  // Helper: Build procedural 3D Salmani architectural villa
  function buildProceduralBuilding(floor1: THREE.Group, floor2: THREE.Group) {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      transmission: 0.8,
    });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const floorSlabMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const majlisMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 }); // Saudi red/gold carpet tone

    // Ground Floor Slab
    const slab1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 5), floorSlabMat);
    slab1.position.set(0, 0, 0);
    slab1.receiveShadow = true;
    floor1.add(slab1);

    // Ground Floor Exterior Walls with openings
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 0.2), wallMat);
    wallBack.position.set(0, 1.2, -2.4);
    wallBack.castShadow = true;
    floor1.add(wallBack);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 5), wallMat);
    wallLeft.position.set(-2.9, 1.2, 0);
    wallLeft.castShadow = true;
    floor1.add(wallLeft);

    // Front Glass Wall
    const glassFront = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.2, 0.1), glassMat);
    glassFront.position.set(0, 1.2, 2.4);
    floor1.add(glassFront);

    // Saudi Majlis Interior Feature (Floor 1)
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 2.5), majlisMat);
    carpet.position.set(-1.2, 0.18, 0);
    floor1.add(carpet);

    // Courtyard Pool / Fountain Feature
    const pool = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 }));
    pool.position.set(1.2, 0.12, -0.5);
    floor1.add(pool);

    // Second Floor Slab
    const slab2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.3, 4.6), floorSlabMat);
    slab2.position.set(0, 2.5, 0);
    slab2.receiveShadow = true;
    floor2.add(slab2);

    // Second Floor Exterior & Salmani Lattice (Mashrabiya)
    const wall2Back = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.2, 0.2), wallMat);
    wall2Back.position.set(0, 3.6, -2.2);
    floor2.add(wall2Back);

    const mashrabiya = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.8, 0.1), woodMat);
    mashrabiya.position.set(0, 3.6, 2.2);
    floor2.add(mashrabiya);
  }

  // Camera Controls Handlers
  const handleResetCamera = () => {
    if (!threeRef.current) return;
    const { camera, controls } = threeRef.current;
    camera.position.set(8, 7, 10);
    controls.target.set(0, 1, 0);
    controls.update();
  };

  const handleZoom = (factor: number) => {
    if (!threeRef.current) return;
    const { camera } = threeRef.current;
    camera.position.multiplyScalar(factor);
  };

  const handleRotate = () => {
    if (!threeRef.current) return;
    const { camera } = threeRef.current;
    const x = camera.position.x;
    const z = camera.position.z;
    camera.position.x = x * Math.cos(0.5) - z * Math.sin(0.5);
    camera.position.z = x * Math.sin(0.5) + z * Math.cos(0.5);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'min-h-[420px]'
      }`}
    >
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur px-3 py-1.5 rounded-xl text-white text-xs">
          <Box className="w-4 h-4 text-cyan-400" />
          <span className="font-bold">
            {isRtl ? 'عرض ثلاثي الأبعاد تفاعلي (WebGL 3D Engine)' : 'WebGL 3D Model Viewer'}
          </span>
          {renderStats.fps > 0 && (
            <span className="text-[10px] text-slate-400 font-mono ml-2">
              {renderStats.fps} FPS | {renderStats.triangles} Tris
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white rounded-xl backdrop-blur transition"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* WebGL Canvas Container */}
      <div className="relative w-full h-[380px] md:h-[450px] bg-slate-950 flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur flex flex-col items-center justify-center text-white space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="text-xs font-semibold">{isRtl ? 'جاري تحميل المجسم ثلاثي الأبعاد...' : 'Loading 3D Model & Textures...'}</div>
          </div>
        )}

        {loadError && (
          <div className="absolute top-14 left-4 right-4 z-30 bg-rose-950/90 border border-rose-800 p-3 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Mount Three.js DOM Element */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* 2D Projected Interactive Hotspots Overlay */}
        {projectedHotspots.map(
          (hs) =>
            hs.visible && (
              <button
                key={hs.id}
                onClick={() => {
                  setActiveHotspot(hs.raw);
                  if (onHotspotClick) onHotspotClick(hs.raw);
                }}
                style={{ left: `${hs.x}px`, top: `${hs.y}px` }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
              >
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-cyan-500 border-2 border-white shadow-lg text-[10px] font-bold text-white items-center justify-center">
                    •
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-cyan-500 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white whitespace-nowrap shadow-xl">
                  {hs.title}
                </div>
              </button>
            )
        )}

        {/* Active Hotspot Modal / Popup Card */}
        {activeHotspot && (
          <div className="absolute bottom-4 left-4 z-30 bg-slate-900/95 border border-cyan-500/60 p-4 rounded-xl text-white max-w-sm shadow-2xl backdrop-blur space-y-2 text-xs">
            <div className="font-bold text-cyan-400 flex justify-between items-center">
              <span>{activeHotspot.title}</span>
              <button onClick={() => setActiveHotspot(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-slate-300">{activeHotspot.info}</p>
          </div>
        )}
      </div>

      {/* Bottom Viewer Toolbar */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-wrap justify-between items-center gap-3 text-xs text-white z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(0.85)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(1.15)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
            title="Rotate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
            title="Reset Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold">{isRtl ? 'الطابق:' : 'Floor Level:'}</span>
          <button
            onClick={() => {}}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              selectedFloor === 1 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isRtl ? 'الطابق الأرضي (L1)' : 'Ground Floor (L1)'}
          </button>
          <button
            onClick={() => {}}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              selectedFloor === 2 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isRtl ? 'الطابق الأول (L2)' : 'First Floor (L2)'}
          </button>
        </div>
      </div>
    </div>
  );
};
