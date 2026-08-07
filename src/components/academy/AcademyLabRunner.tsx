import React, { useState, useEffect } from 'react';
import {
  Code,
  Layout,
  Play,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Terminal,
  ShieldCheck,
  AlertCircle,
  Award
} from 'lucide-react';
import { useUIState } from '../../integration/UIStateContext';

interface Checkpoint {
  id: string;
  label: string;
  status: 'PENDING' | 'VERIFIED';
}

interface LabSession {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  lessonId: string;
  labType: 'CODING_LAB' | 'STUDIO_LAB';
  codeProjectId?: string | null;
  studioProjectId?: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED' | 'FAILED';
  checkpointsJson: string;
  score: number;
  feedback?: string | null;
}

interface AcademyLabRunnerProps {
  courseId: string;
  lessonId: string;
  labType: 'CODING_LAB' | 'STUDIO_LAB';
  lessonTitle?: string;
  isRtl?: boolean;
  onLabCompleted?: () => void;
}

export const AcademyLabRunner: React.FC<AcademyLabRunnerProps> = ({
  courseId,
  lessonId,
  labType,
  lessonTitle = 'Practical Lab Workspace',
  isRtl = false,
  onLabCompleted,
}) => {
  const { setCurrentMode, launchIdeWithPrompt } = useUIState();
  const [session, setSession] = useState<LabSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  // Default checkpoint guidelines based on lab type
  const defaultCheckpoints = labType === 'CODING_LAB'
    ? [
        isRtl ? 'إعداد هيكل المشروع والتبعيات المطلوبة' : 'Setup project structure & required dependencies',
        isRtl ? 'كتابة برمجية الوظائف الأساسية واختبار المنطق' : 'Implement core logic & functional handlers',
        isRtl ? 'التحقق من عدم وجود أخطاء في تجميع الكود (Type Checking)' : 'Verify TypeScript compilation & zero errors',
      ]
    : [
        isRtl ? 'تصميم واجهة المستخدم وتأطير المكونات' : 'Design UI structure & component wireframes',
        isRtl ? 'ربط نموذج البيانات مع أزرار التفاعل' : 'Bind data model schema with interactive controls',
        isRtl ? 'معاينة التطبيق والتحقق من الاستجابة' : 'Preview application build & confirm responsiveness',
      ];

  // Fetch or initialize lab session
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/academy/labs/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            lessonId,
            labType,
            checkpoints: defaultCheckpoints,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to initialize lab session');

        if (isMounted && data.session) {
          setSession(data.session);
          try {
            const parsedCps = JSON.parse(data.session.checkpointsJson);
            setCheckpoints(parsedCps);
          } catch {
            setCheckpoints(
              defaultCheckpoints.map((cp, idx) => ({ id: `cp_${idx + 1}`, label: cp, status: 'PENDING' }))
            );
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error connecting to lab engine');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();
    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId, labType]);

  // Toggle individual checkpoint verification state
  const toggleCheckpoint = (id: string) => {
    if (session?.status === 'COMPLETED') return;
    setCheckpoints((prev) =>
      prev.map((cp) =>
        cp.id === id ? { ...cp, status: cp.status === 'VERIFIED' ? 'PENDING' : 'VERIFIED' } : cp
      )
    );
  };

  // Launch into main OPROX Code or Studio workspace
  const handleLaunchEngine = () => {
    if (labType === 'CODING_LAB') {
      launchIdeWithPrompt(
        `Academy Coding Lab: ${lessonTitle}\nCourse ID: ${courseId}\nLesson ID: ${lessonId}`,
        `Academy Lab - ${lessonTitle}`
      );
    } else {
      setCurrentMode('studio');
    }
  };

  // Submit lab completion
  const handleSubmitLab = async () => {
    if (!session) return;
    setSubmitting(true);
    setError(null);

    try {
      const verifiedCount = checkpoints.filter((c) => c.status === 'VERIFIED').length;
      const calculatedScore = checkpoints.length > 0
        ? Math.round((verifiedCount / checkpoints.length) * 100)
        : 100;

      const res = await fetch(`/api/academy/labs/session/${session.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkpointsJson: JSON.stringify(checkpoints),
          score: calculatedScore,
          feedback: isRtl
            ? `تم إكمال المختبر بنجاح بتقدير ${calculatedScore}%. تم التحقق من أهداف المختبر العملي.`
            : `Practical lab submitted with score ${calculatedScore}%. All required checkpoints verified.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit lab evaluation');

      setSession(data.session);
      if (onLabCompleted && calculatedScore >= 70) {
        onLabCompleted();
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting lab');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">
          {isRtl ? 'جاري تحميل وتجهيز بيئة المختبر العملي...' : 'Initializing OPROX Lab Session Environment...'}
        </p>
      </div>
    );
  }

  const isCompleted = session?.status === 'COMPLETED';

  return (
    <div className={`rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${
            labType === 'CODING_LAB'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          }`}>
            {labType === 'CODING_LAB' ? <Code className="w-6 h-6" /> : <Layout className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {labType === 'CODING_LAB'
                  ? (isRtl ? 'مختبر برمجيات OPROX Code' : 'OPROX Code Practical Lab')
                  : (isRtl ? 'مختبر تطبيقات OPROX Studio' : 'OPROX Studio Practical Lab')}
              </span>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRtl ? 'مكتمل' : 'Completed'} ({session?.score}%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  {isRtl ? 'قيد التنفيذ' : 'In Progress'}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{lessonTitle}</h3>
          </div>
        </div>

        {/* Primary Engine Launcher Button */}
        <button
          onClick={handleLaunchEngine}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
            labType === 'CODING_LAB'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/30'
          }`}
        >
          {labType === 'CODING_LAB' ? <Terminal className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
          <span>
            {labType === 'CODING_LAB'
              ? (isRtl ? 'فتح في OPROX Code IDE' : 'Launch in OPROX Code')
              : (isRtl ? 'فتح في OPROX Studio' : 'Launch in OPROX Studio')}
          </span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Lab Content Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lab Instructions & Engine Connection Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{isRtl ? 'تعليمات وبيئة التشغيل' : 'Lab Instructions & Integration'}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isRtl
                ? 'يستخدم هذا المختبر محرك الأمان والتطوير الموحد لـ OPROX. يمكنك الضغط على زر "فتح المختبر" للانتقال إلى البيئة البرمجية الكاملة وتطبيق الأهداف المطلوب التحقق منها.'
                : 'This practical lab connects directly to the production OPROX Code/Studio runtime engine with active VFS and workspace tracking. Launch the workspace to complete the project requirements.'}
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-4 text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500">{isRtl ? 'معرف الجلسة: ' : 'Session ID: '}</span>
                <span className="font-mono text-slate-300">{session?.id}</span>
              </div>
              <div>
                <span className="text-slate-500">{isRtl ? 'مشروع OPROX: ' : 'Linked Project: '}</span>
                <span className="font-mono text-emerald-400">
                  {session?.codeProjectId || session?.studioProjectId || 'oprox_default_vfs'}
                </span>
              </div>
            </div>
          </div>

          {session?.feedback && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
              <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">{isRtl ? 'تقييم الأداء: ' : 'Evaluation Feedback:'}</span>
                <p className="text-slate-300">{session.feedback}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Checkpoints & Verification Panel */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isRtl ? 'نقاط التحقق والتقييم' : 'Lab Checkpoints'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {checkpoints.filter((c) => c.status === 'VERIFIED').length}/{checkpoints.length}
              </span>
            </div>

            <div className="space-y-2">
              {checkpoints.map((cp) => (
                <button
                  key={cp.id}
                  onClick={() => toggleCheckpoint(cp.id)}
                  disabled={isCompleted}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                    cp.status === 'VERIFIED'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                    cp.status === 'VERIFIED'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'border-slate-600 bg-slate-950'
                  }`}>
                    {cp.status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="leading-snug">{cp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {!isCompleted && (
            <button
              onClick={handleSubmitLab}
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isRtl ? 'جاري التحقق والتقديم...' : 'Submitting Lab Evaluation...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRtl ? 'تقديم تقييم المختبر' : 'Submit Lab Evaluation'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
