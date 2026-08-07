import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Download,
  FileText,
  Video,
  Code,
  Lock,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  Award,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { AssessmentRunner } from './AssessmentRunner';
import { AssignmentRunner } from './AssignmentRunner';
import { AcademyAiTutorView } from './AcademyAiTutorView';
import { AcademyAdaptiveRecommendationsView } from './AcademyAdaptiveRecommendationsView';
import { AcademyLabRunner } from './AcademyLabRunner';

export interface LessonResource {
  id: string;
  titleEn: string;
  titleAr: string;
  resourceType: string;
  resourceUrl: string;
  fileSizeBytes?: number;
}

export interface Lesson {
  id: string;
  titleEn: string;
  titleAr: string;
  lessonType: string; // TEXT | VIDEO | CODING_LAB | STUDIO_LAB | QUIZ
  contentEn?: string;
  contentAr?: string;
  videoUrl?: string;
  durationMinutes: number;
  displayOrder: number;
  isPreview: boolean;
  resources: LessonResource[];
}

export interface Module {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  displayOrder: number;
  lessons: Lesson[];
}

export interface CoursePlayerPackage {
  course: {
    id: string;
    titleEn: string;
    titleAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    level: string;
    language: string;
  };
  modules: Module[];
  progress: {
    completedLessonIds: string[];
    completedLessonsCount: number;
    totalLessonsCount: number;
    progressPercent: number;
    lastLessonId: string | null;
  };
  bookmarks: Array<{ id: string; lessonId: string }>;
}

interface AcademyCoursePlayerProps {
  courseId: string;
  lang: 'en' | 'ar';
  onClose: () => void;
  onProgressUpdated?: () => void;
}

export const AcademyCoursePlayer: React.FC<AcademyCoursePlayerProps> = ({
  courseId,
  lang,
  onClose,
  onProgressUpdated,
}) => {
  const isRtl = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<CoursePlayerPackage | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [bookmarkedLessons, setBookmarkedLessons] = useState<Set<string>>(new Set());
  const [activePlayerTab, setActivePlayerTab] = useState<'content' | 'ai_tutor' | 'adaptive'>('content');

  useEffect(() => {
    loadPlayerPackage();
  }, [courseId]);

  async function loadPlayerPackage() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/academy/player/courses/${courseId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || data.error || 'Failed to load course player.');
        setLoading(false);
        return;
      }

      setPlayerData(data);

      const bmSet = new Set<string>((data.bookmarks || []).map((b: any) => b.lessonId));
      setBookmarkedLessons(bmSet);

      // Flatten all lessons
      const allLessons: Lesson[] = (data.modules || []).flatMap((m: Module) => m.lessons);

      if (allLessons.length > 0) {
        // Auto-resume to last accessed lesson or first incomplete lesson
        const lastId = data.progress?.lastLessonId;
        if (lastId && allLessons.some((l) => l.id === lastId)) {
          setActiveLessonId(lastId);
        } else {
          const firstIncomplete = allLessons.find(
            (l) => !data.progress?.completedLessonIds?.includes(l.id)
          );
          setActiveLessonId(firstIncomplete ? firstIncomplete.id : allLessons[0].id);
        }
      }
    } catch (err: any) {
      setError('Network error while loading course player.');
    } finally {
      setLoading(false);
    }
  }

  // Get active lesson and navigation context
  const allLessons: Lesson[] = playerData ? playerData.modules.flatMap((m) => m.lessons) : [];
  const activeIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = activeIndex !== -1 ? allLessons[activeIndex] : null;

  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;

  const isCompleted = activeLessonId && playerData?.progress?.completedLessonIds?.includes(activeLessonId);

  async function handleToggleComplete() {
    if (!activeLessonId || !playerData) return;
    setMarkingComplete(true);

    try {
      const res = await fetch(`/api/academy/player/lessons/${activeLessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: playerData.course.id,
          completed: !isCompleted,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update local progress state
        const updatedCompletedIds = new Set(playerData.progress.completedLessonIds);
        if (!isCompleted) {
          updatedCompletedIds.add(activeLessonId);
        } else {
          updatedCompletedIds.delete(activeLessonId);
        }

        setPlayerData({
          ...playerData,
          progress: {
            ...playerData.progress,
            completedLessonIds: Array.from(updatedCompletedIds),
            completedLessonsCount: updatedCompletedIds.size,
            progressPercent: data.courseProgress.progressPercent,
            lastLessonId: activeLessonId,
          },
        });

        if (onProgressUpdated) onProgressUpdated();
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    } finally {
      setMarkingComplete(false);
    }
  }

  async function handleToggleBookmark() {
    if (!activeLessonId || !playerData) return;
    setBookmarking(true);

    try {
      const res = await fetch(`/api/academy/player/lessons/${activeLessonId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: playerData.course.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const nextBm = new Set(bookmarkedLessons);
        if (data.bookmarked) {
          nextBm.add(activeLessonId);
        } else {
          nextBm.delete(activeLessonId);
        }
        setBookmarkedLessons(nextBm);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setBookmarking(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">
          {isRtl ? 'جاري فتح مشغّل الدورة التعليمية...' : 'Launching Course Player...'}
        </p>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            {isRtl ? 'تعذر الوصول إلى مشغّل الدورة' : 'Player Access Restricted'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all"
          >
            {isRtl ? 'إغلاق المشغل' : 'Close Player'}
          </button>
        </div>
      </div>
    );
  }

  const courseTitle = isRtl
    ? playerData.course.titleAr || playerData.course.titleEn
    : playerData.course.titleEn;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden font-sans"
    >
      {/* Top Player Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            title={isRtl ? 'إغلاق والعودة للأكاديمية' : 'Exit Course Player'}
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xs md:text-sm font-bold text-white truncate max-w-md">
              {courseTitle}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{playerData.progress.completedLessonsCount} / {playerData.progress.totalLessonsCount} {isRtl ? 'دروس مكملة' : 'lessons completed'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{playerData.progress.progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs mx-4">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${playerData.progress.progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-emerald-400 flex-shrink-0">
            {playerData.progress.progressPercent}%
          </span>
        </div>

        {/* Player View Tabs (Content / AI Tutor / Adaptive) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActivePlayerTab('content')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activePlayerTab === 'content'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isRtl ? 'محتوى الدرس' : 'Lesson Content'}</span>
          </button>

          <button
            onClick={() => setActivePlayerTab('ai_tutor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activePlayerTab === 'ai_tutor'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isRtl ? 'المعلم الذكي' : 'AI Tutor'}</span>
          </button>

          <button
            onClick={() => setActivePlayerTab('adaptive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activePlayerTab === 'adaptive'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isRtl ? 'التوصيات التكيفية' : 'Adaptive'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {activeLessonId && (
            <button
              onClick={handleToggleBookmark}
              disabled={bookmarking}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                bookmarkedLessons.has(activeLessonId)
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {bookmarkedLessons.has(activeLessonId)
                  ? isRtl
                    ? 'محفوظ'
                    : 'Bookmarked'
                  : isRtl
                  ? 'حفظ الدرس'
                  : 'Bookmark'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Main Split Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Course Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-950">
          {activePlayerTab === 'ai_tutor' ? (
            <div className="max-w-4xl mx-auto h-[650px]">
              <AcademyAiTutorView
                courseId={courseId}
                courseTitle={courseTitle}
                lessonId={activeLessonId}
                lessonTitle={activeLesson ? (isRtl ? activeLesson.titleAr || activeLesson.titleEn : activeLesson.titleEn) : undefined}
                lang={lang}
              />
            </div>
          ) : activePlayerTab === 'adaptive' ? (
            <div className="max-w-4xl mx-auto">
              <AcademyAdaptiveRecommendationsView
                courseId={courseId}
                courseTitle={courseTitle}
                lang={lang}
                onNavigateLesson={(lid) => {
                  setActiveLessonId(lid);
                  setActivePlayerTab('content');
                }}
              />
            </div>
          ) : activeLesson ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Lesson Title & Type Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 uppercase">
                      {activeLesson.lessonType}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeLesson.durationMinutes} {isRtl ? 'دقيقة' : 'mins'}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-white">
                    {isRtl ? activeLesson.titleAr || activeLesson.titleEn : activeLesson.titleEn}
                  </h1>
                </div>

                {/* Complete Button */}
                <button
                  onClick={handleToggleComplete}
                  disabled={markingComplete}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isCompleted
                      ? isRtl
                        ? 'مكتمل ✓ (اضغط للإلغاء)'
                        : 'Completed ✓ (Toggle)'
                      : isRtl
                      ? 'تحديد كـ مكتمل'
                      : 'Mark as Complete'}
                  </span>
                </button>
              </div>

              {/* Lesson Type Specific Renderers */}
              {activeLesson.lessonType === 'VIDEO' && (
                <div className="space-y-4">
                  <div className="aspect-video bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-2xl">
                    {activeLesson.videoUrl ? (
                      <iframe
                        src={activeLesson.videoUrl}
                        title={activeLesson.titleEn}
                        className="w-full h-full rounded-2xl"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                          <Video className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-bold text-white">
                          {isRtl ? 'فيديو شات تعليمي مدمج' : 'Interactive Video Session'}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {isRtl
                            ? 'هذا الدرس مجهز للمشاهدة المباشرة. اضغط اكتمال للتقدم في الدورة.'
                            : 'This lesson includes interactive stream content. Progress is saved automatically.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeLesson.lessonType === 'TEXT' && (
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 space-y-4 leading-relaxed text-slate-300 text-sm">
                  <div className="prose prose-invert max-w-none">
                    {(isRtl ? activeLesson.contentAr || activeLesson.contentEn : activeLesson.contentEn) || (
                      <p className="text-slate-400 italic">
                        {isRtl
                          ? 'محتوى نصي إرشادي لهذا الدرس. يغطي مفاهيم التصميم والأطر النظرية.'
                          : 'Text-based comprehensive explanation covering theoretical concepts and system design.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(activeLesson.lessonType === 'CODING_LAB' || activeLesson.lessonType === 'STUDIO_LAB') && (
                <AcademyLabRunner
                  courseId={playerData.course.id}
                  lessonId={activeLesson.id}
                  labType={activeLesson.lessonType}
                  lessonTitle={isRtl ? activeLesson.titleAr || activeLesson.titleEn : activeLesson.titleEn}
                  isRtl={isRtl}
                  onLabCompleted={handleToggleComplete}
                />
              )}

              {activeLesson.lessonType === 'QUIZ' && (
                <AssessmentRunner
                  courseId={playerData.course.id}
                  lessonId={activeLesson.id}
                  isRtl={isRtl}
                  onQuizPassed={handleToggleComplete}
                />
              )}

              {activeLesson.lessonType === 'ASSIGNMENT' && (
                <AssignmentRunner
                  courseId={playerData.course.id}
                  lessonId={activeLesson.id}
                  isRtl={isRtl}
                />
              )}

              {/* Lesson Resources Download Section */}
              {activeLesson.resources && activeLesson.resources.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>{isRtl ? 'المصادر والملفات المرفقة بالدرس' : 'Lesson Attachments & Resources'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeLesson.resources.map((res) => (
                      <a
                        key={res.id}
                        href={res.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-200 transition-all"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{isRtl ? res.titleAr || res.titleEn : res.titleEn}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Navigation Controls */}
              <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <button
                  disabled={!prevLesson}
                  onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-bold disabled:opacity-40 transition-all"
                >
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  <span>{isRtl ? 'الدرس السابق' : 'Previous Lesson'}</span>
                </button>

                <button
                  disabled={!nextLesson}
                  onClick={() => nextLesson && setActiveLessonId(nextLesson.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-40 transition-all shadow-lg"
                >
                  <span>{isRtl ? 'الدرس التالي' : 'Next Lesson'}</span>
                  {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 text-slate-400 space-y-2">
              <p>{isRtl ? 'اختر درساً من القائمة الجانبية للبدء.' : 'Select a lesson from the sidebar to begin.'}</p>
            </div>
          )}
        </main>

        {/* Course Curriculum Navigation Sidebar */}
        <aside className="w-full md:w-80 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{isRtl ? 'محتويات الدورة' : 'Course Curriculum'}</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {allLessons.length} {isRtl ? 'دروس' : 'lessons'}
            </span>
          </div>

          <div className="p-3 space-y-4">
            {playerData.modules.map((mod, modIdx) => (
              <div key={mod.id} className="space-y-1.5">
                <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isRtl ? `الوحدة ${modIdx + 1}: ${mod.titleAr || mod.titleEn}` : `Module ${modIdx + 1}: ${mod.titleEn}`}
                </div>

                <div className="space-y-1">
                  {mod.lessons.map((lsn) => {
                    const active = lsn.id === activeLessonId;
                    const done = playerData.progress.completedLessonIds.includes(lsn.id);

                    return (
                      <button
                        key={lsn.id}
                        onClick={() => setActiveLessonId(lsn.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                          active
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                          )}
                          <span className="truncate">{isRtl ? lsn.titleAr || lsn.titleEn : lsn.titleEn}</span>
                        </div>

                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {lsn.durationMinutes}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
