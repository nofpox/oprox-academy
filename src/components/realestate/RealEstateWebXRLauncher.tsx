import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import {
  Glasses,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { logCapabilityCheck } from '../../lib/realestate/realEstatePhase6Store';

interface RealEstateWebXRLauncherProps {
  tenantId?: string;
  userId?: string;
  linkedEntityId?: string;
  language?: 'en' | 'ar';
}

export const RealEstateWebXRLauncher: React.FC<RealEstateWebXRLauncherProps> = ({
  tenantId = 'tenant_default',
  userId = 'usr_default',
  linkedEntityId = 'prop_001',
  language = 'en',
}) => {
  const isRtl = language === 'ar';

  const [vrStatus, setVrStatus] = useState<'SUPPORTED' | 'UNSUPPORTED' | 'NOT_CONFIGURED'>('NOT_CONFIGURED');
  const [arStatus, setArStatus] = useState<'SUPPORTED' | 'UNSUPPORTED' | 'NOT_CONFIGURED'>('NOT_CONFIGURED');
  const [checking, setChecking] = useState<boolean>(true);
  const [activeSessionType, setActiveSessionType] = useState<'VR' | 'AR' | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    checkWebXRCapabilities();
  }, []);

  const checkWebXRCapabilities = async () => {
    setChecking(true);
    setSessionError(null);

    let vrState: 'SUPPORTED' | 'UNSUPPORTED' | 'NOT_CONFIGURED' = 'UNSUPPORTED';
    let arState: 'SUPPORTED' | 'UNSUPPORTED' | 'NOT_CONFIGURED' = 'UNSUPPORTED';

    if ('xr' in navigator && navigator.xr) {
      try {
        const vrSupp = await navigator.xr.isSessionSupported('immersive-vr');
        vrState = vrSupp ? 'SUPPORTED' : 'UNSUPPORTED';
      } catch (err) {
        vrState = 'UNSUPPORTED';
      }

      try {
        const arSupp = await navigator.xr.isSessionSupported('immersive-ar');
        arState = arSupp ? 'SUPPORTED' : 'UNSUPPORTED';
      } catch (err) {
        arState = 'UNSUPPORTED';
      }
    } else {
      // User agent string fallback check
      const ua = navigator.userAgent || '';
      if (/OculusQuest|Quest|WebXR|VR/i.test(ua)) {
        vrState = 'SUPPORTED';
      }
      if (/Android|iPhone|iPad|ARCore|ARKit/i.test(ua) && !/Googlebot/i.test(ua)) {
        arState = 'SUPPORTED';
      }
    }

    setVrStatus(vrState);
    setArStatus(arState);
    setChecking(false);

    // Log to DB
    await logCapabilityCheck(tenantId, userId, 'VR', vrState, navigator.userAgent, linkedEntityId);
    await logCapabilityCheck(tenantId, userId, 'AR', arState, navigator.userAgent, linkedEntityId);
  };

  const startVRSession = async () => {
    setSessionError(null);
    if (!('xr' in navigator) || !navigator.xr) {
      setSessionError(
        isRtl
          ? 'المتصفح الحالي لا يدعم واجهة WebXR للواقع الافتراضي. يرجى فتح التطبيق داخل متصفح Quest/WebXR.'
          : 'WebXR VR API is not natively available in this browser environment. Headset or WebXR compatible browser required.'
      );
      return;
    }

    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
      });
      setActiveSessionType('VR');

      session.addEventListener('end', () => {
        setActiveSessionType(null);
      });
    } catch (err: any) {
      setSessionError(err.message || 'Failed to initialize WebXR VR session');
    }
  };

  const startARSession = async () => {
    setSessionError(null);
    if (!('xr' in navigator) || !navigator.xr) {
      setSessionError(
        isRtl
          ? 'المتصفح الحالي لا يدعم واجهة WebXR للواقع المعزز. يرجى استخدام هاتف ذكي يحمل متصفح يدعم ARCore/ARKit.'
          : 'WebXR AR API is not natively available in this browser environment. ARCore/ARKit compatible device required.'
      );
      return;
    }

    try {
      const session = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['hit-test', 'dom-overlay'],
      });
      setActiveSessionType('AR');

      session.addEventListener('end', () => {
        setActiveSessionType(null);
      });
    } catch (err: any) {
      setSessionError(err.message || 'Failed to initialize WebXR AR session');
    }
  };

  return (
    <div className="space-y-6">
      {/* VR & AR Capability Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VR Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Glasses className="w-8 h-8 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-lg">
                    {isRtl ? 'تجربة الواقع الافتراضي (WebXR VR)' : 'WebXR Immersive VR Headset'}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {isRtl ? 'نظارات Oculus Quest / HTC Vive' : 'Direct headset immersion & spatial navigation'}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  vrStatus === 'SUPPORTED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {vrStatus}
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {isRtl
                ? 'يتيح للمشتري أو المستثمر الدخول في جلسة واقع افتراضي كاملة للتجول في البرج أو الفيلة بجهود حقيقية.'
                : 'Launches a real WebXR VR session to walk through 3D architectural models in 1:1 scale.'}
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            <button
              onClick={startVRSession}
              disabled={activeSessionType === 'VR'}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/40"
            >
              <Glasses className="w-4 h-4" />
              <span>{isRtl ? 'بدء جلسة الواقع الافتراضي (Enter VR)' : 'Enter Immersive VR Session'}</span>
            </button>
          </div>
        </div>

        {/* AR Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-lg">
                    {isRtl ? 'تجربة الواقع المعزز (WebXR AR)' : 'WebXR Mobile Spatial AR'}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {isRtl ? 'إسقاط الأثاث عبر ARCore / ARKit' : 'Place 3D furniture & layouts into physical room'}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  arStatus === 'SUPPORTED'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {arStatus}
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              {isRtl
                ? 'يمكن المستخدم من توجيه كاميرا الهاتف وإسقاط النماذج والتصاميم داخل المساحة الفعليه.'
                : 'Uses native WebXR AR hit testing to position 3D furniture models onto floor surfaces in real time.'}
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            <button
              onClick={startARSession}
              disabled={activeSessionType === 'AR'}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-900/40"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isRtl ? 'بدء جلسة الواقع المعزز (Enter AR)' : 'Enter Spatial AR Session'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Session Notification / Error banner */}
      {sessionError && (
        <div className="p-4 bg-amber-950/80 border border-amber-800/80 rounded-xl text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>{sessionError}</span>
          </div>
          <button
            onClick={() => setSessionError(null)}
            className="text-amber-400 hover:text-white font-bold underline ml-4 text-[11px]"
          >
            {isRtl ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Hardware Acceptance & Capability Refresh */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <span>
            {isRtl
              ? 'WebXR يتطلب جهاز فيزيائي متوافق (Quest/AR Phone). المحاكي يوفر وضع العرض ثلاثي الأبعاد.'
              : 'WebXR session entry requires compatible physical hardware (Meta Quest, ARCore/ARKit phone). Desktop fallback active.'}
          </span>
        </div>

        <button
          onClick={checkWebXRCapabilities}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>{isRtl ? 'إعادة الإكتشاف' : 'Re-check Hardware'}</span>
        </button>
      </div>
    </div>
  );
};
