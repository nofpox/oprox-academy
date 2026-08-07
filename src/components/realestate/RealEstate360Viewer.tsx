import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Compass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Eye,
  ChevronRight,
} from 'lucide-react';

interface PanoramaHotspot {
  id: string;
  title: string;
  info: string;
  lon: number; // longitude degree
  lat: number; // latitude degree
}

interface RealEstate360ViewerProps {
  panoramaUrl?: string;
  title?: string;
  hotspots?: PanoramaHotspot[];
  onHotspotClick?: (hs: PanoramaHotspot) => void;
  language?: 'en' | 'ar';
}

export const RealEstate360Viewer: React.FC<RealEstate360ViewerProps> = ({
  panoramaUrl,
  title = 'Saudi Villa Grand Living Room — 360° Panorama',
  hotspots = [
    { id: 'hs_360_1', title: 'Courtyard Access', info: 'Direct glass sliding door to private garden', lon: 45, lat: 0 },
    { id: 'hs_360_2', title: 'Salmani Ceiling Feature', info: 'Custom recessed lighting with Saudi decorative frieze', lon: -60, lat: 25 },
    { id: 'hs_360_3', title: 'Dining Entrance', info: 'Double-leaf mahogany archway connecting to dining room', lon: 135, lat: -10 },
  ],
  onHotspotClick,
  language = 'en',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeHotspot, setActiveHotspot] = useState<PanoramaHotspot | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const isRtl = language === 'ar';

  // Dragging state
  const isUserInteracting = useRef<boolean>(false);
  const onPointerDownMouseX = useRef<number>(0);
  const onPointerDownMouseY = useRef<number>(0);
  const lon = useRef<number>(0);
  const lat = useRef<number>(0);
  const onPointerDownLon = useRef<number>(0);
  const onPointerDownLat = useRef<number>(0);

  const [projectedHotspots, setProjectedHotspots] = useState<
    { id: string; title: string; info: string; x: number; y: number; visible: boolean; raw: PanoramaHotspot }[]
  >([]);

  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    sphereMesh: THREE.Mesh;
    animationFrameId: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let isDisposed = false;
    let animId = 0;

    const width = mountRef.current.clientWidth || 640;
    const height = mountRef.current.clientHeight || 380;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // 4. Inverted Sphere for 360 Panorama
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // Create 360 procedural texture or load texture
    const textureCanvas = createProcedural360Texture();
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphereMesh = new THREE.Mesh(geometry, material);
    scene.add(sphereMesh);

    threeRef.current = {
      scene,
      camera,
      renderer,
      sphereMesh,
      animationFrameId: 0,
    };

    setLoading(false);

    // 5. Render Loop
    const animate = () => {
      if (isDisposed) return;

      // Restrict latitude
      lat.current = Math.max(-85, Math.min(85, lat.current));

      const phi = THREE.MathUtils.degToRad(90 - lat.current);
      const theta = THREE.MathUtils.degToRad(lon.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(targetX, targetY, targetZ);

      renderer.render(scene, camera);

      // Project hotspots
      const newProjected = hotspots.map((hs) => {
        const hsPhi = THREE.MathUtils.degToRad(90 - hs.lat);
        const hsTheta = THREE.MathUtils.degToRad(hs.lon);

        const worldVec = new THREE.Vector3(
          400 * Math.sin(hsPhi) * Math.cos(hsTheta),
          400 * Math.cos(hsPhi),
          400 * Math.sin(hsPhi) * Math.sin(hsTheta)
        );

        const screenVec = worldVec.clone().project(camera);
        const x = ((screenVec.x + 1) * width) / 2;
        const y = ((-screenVec.y + 1) * height) / 2;
        const isBehind = screenVec.z > 1;

        return {
          id: hs.id,
          title: hs.title,
          info: hs.info,
          x,
          y,
          visible: !isBehind && screenVec.x >= -0.9 && screenVec.x <= 0.9 && screenVec.y >= -0.9 && screenVec.y <= 0.9,
          raw: hs,
        };
      });
      setProjectedHotspots(newProjected);

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [panoramaUrl]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isUserInteracting.current = true;
    onPointerDownMouseX.current = e.clientX;
    onPointerDownMouseY.current = e.clientY;
    onPointerDownLon.current = lon.current;
    onPointerDownLat.current = lat.current;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isUserInteracting.current) return;
    lon.current = (onPointerDownMouseX.current - e.clientX) * 0.15 + onPointerDownLon.current;
    lat.current = (e.clientY - onPointerDownMouseY.current) * 0.15 + onPointerDownLat.current;
  };

  const handlePointerUp = () => {
    isUserInteracting.current = false;
  };

  // Helper: Create a rich procedural equirectangular 360 panorama texture
  function createProcedural360Texture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Gradient Sky/Room interior
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.3, '#1e293b');
    grad.addColorStop(0.7, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Architectural grid / window lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Saudi Salmani Decorative Elements & FurnitureSilhouettes
    ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('OPROX 360° IMMERSIVE PANORAMA — SALMANI LUXURY VILLA', 200, 200);

    return canvas;
  }

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
      {/* Header Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur px-3 py-1.5 rounded-xl text-white text-xs">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="font-bold">{title}</span>
        </div>

        <button
          onClick={toggleFullscreen}
          className="pointer-events-auto p-2 bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white rounded-xl backdrop-blur transition"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 360 Interactive Viewport */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full h-[380px] md:h-[450px] bg-slate-950 flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur flex flex-col items-center justify-center text-white space-y-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="text-xs font-semibold">{isRtl ? 'جاري تحميل البانوراما 360...' : 'Loading 360° Panorama...'}</div>
          </div>
        )}

        <div ref={mountRef} className="w-full h-full" />

        {/* Hotspots */}
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
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-white shadow-lg text-[10px] font-bold text-white items-center justify-center">
                    360
                  </span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-amber-500 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white whitespace-nowrap shadow-xl">
                  {hs.title}
                </div>
              </button>
            )
        )}

        {/* Active Hotspot Info Card */}
        {activeHotspot && (
          <div className="absolute bottom-4 left-4 z-30 bg-slate-900/95 border border-amber-500/60 p-4 rounded-xl text-white max-w-sm shadow-2xl backdrop-blur space-y-2 text-xs">
            <div className="font-bold text-amber-400 flex justify-between items-center">
              <span>{activeHotspot.title}</span>
              <button onClick={() => setActiveHotspot(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-slate-300">{activeHotspot.info}</p>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 text-xs text-slate-400 flex justify-between items-center">
        <span>{isRtl ? 'اسحب بالماوس أو الإصبع للتدوير 360 درجة' : 'Drag to rotate 360° around the room'}</span>
        <span className="text-cyan-400 font-semibold">{isRtl ? 'وضع 360 نشط' : '360° Equirectangular Mode Active'}</span>
      </div>
    </div>
  );
};
