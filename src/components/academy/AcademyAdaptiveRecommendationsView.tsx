import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Lightbulb, CheckCircle, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, X } from 'lucide-react';

export interface AdaptiveRecommendation {
  id: string;
  recommendationType: 'REVIEW_LESSON' | 'NEXT_LESSON' | 'WEAK_CONCEPT' | 'PRACTICE' | 'NEXT_COURSE';
  titleEn: string;
  titleAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  lessonId?: string | null;
  targetConcept?: string | null;
  priority: number;
}

export interface LearnerMastery {
  id: string;
  conceptKey: string;
  masteryScore: number;
  totalAttempts: number;
  correctAttempts: number;
  lastEvaluatedAt: string;
}

interface AcademyAdaptiveRecommendationsViewProps {
  courseId: string;
  courseTitle: string;
  lang: 'en' | 'ar';
  onNavigateLesson?: (lessonId: string) => void;
}

export const AcademyAdaptiveRecommendationsView: React.FC<AcademyAdaptiveRecommendationsViewProps> = ({
  courseId,
  courseTitle,
  lang,
  onNavigateLesson,
}) => {
  const isRtl = lang === 'ar';
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [masteryList, setMasteryList] = useState<LearnerMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdaptiveData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [recsRes, masteryRes] = await Promise.all([
        fetch(`/api/academy/adaptive/recommendations?courseId=${courseId}`),
        fetch(`/api/academy/adaptive/mastery?courseId=${courseId}`),
      ]);

      if (!recsRes.ok || !masteryRes.ok) {
        throw new Error('Failed to fetch adaptive learning recommendations.');
      }

      const recsData = await recsRes.json();
      const masteryData = await masteryRes.json();

      if (recsData.recommendations) setRecommendations(recsData.recommendations);
      if (masteryData.mastery) setMasteryList(masteryData.mastery);
    } catch (err: any) {
      setError(err.message || 'Error loading adaptive learning data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdaptiveData();
  }, [courseId]);

  const handleDismiss = async (recId: string) => {
    try {
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      await fetch(`/api/academy/adaptive/recommendations/${recId}/dismiss`, {
        method: 'POST',
      });
    } catch (err: any) {
      console.error('Dismiss error:', err);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'WEAK_CONCEPT':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'REVIEW_LESSON':
        return <RefreshCw className="w-5 h-5 text-indigo-400" />;
      case 'NEXT_LESSON':
        return <Target className="w-5 h-5 text-emerald-400" />;
      case 'NEXT_COURSE':
        return <TrendingUp className="w-5 h-5 text-purple-400" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                {isRtl ? 'المحرك التكيفي والتحليلي للتعلم' : 'Adaptive Learning Engine'}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                {isRtl ? 'بيانات حقيقية' : 'Real Signals'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRtl
                ? `توصيات مخصصة ومصممة بناءً على أداء المتعلم في دورة: ${courseTitle}`
                : `Tailored recommendations generated from actual learner progress in: ${courseTitle}`}
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdaptiveData}
          disabled={loading}
          className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-2 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>{isRtl ? 'تحديث الإشارات' : 'Refresh Signals'}</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>{isRtl ? 'جاري تقييم إشارات الإتقان والتوصيات...' : 'Evaluating mastery signals & recommendations...'}</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Adaptive Recommendations List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? 'التوصيات التكيفية الذكية' : 'Intelligent Adaptive Recommendations'}</span>
              </h4>
              <span className="text-xs text-slate-500">
                {recommendations.length} {isRtl ? 'توصيات نشطة' : 'Active Items'}
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h5 className="font-medium text-sm text-slate-200">
                  {isRtl ? 'ممتاز! لا توجد فجوات تعلم ملحوظة' : 'Great Job! No Skill Gaps Detected'}
                </h5>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {isRtl
                    ? 'تقدمك في الدورة يسير بانتظام مرتفع. استمر في إنهاء الدروس والحل التفاعلي.'
                    : 'Your progression in this course is strong. Continue completing upcoming modules and quizzes.'}
                </p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 relative group hover:border-slate-700 transition"
                >
                  <button
                    onClick={() => handleDismiss(rec.id)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 p-1 rounded-md hover:bg-slate-800 transition"
                    title={isRtl ? 'تجاهل' : 'Dismiss'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-start gap-3 pr-6">
                    <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                      {getRecommendationIcon(rec.recommendationType)}
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-semibold text-sm text-slate-100">
                        {isRtl ? rec.titleAr : rec.titleEn}
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {isRtl ? rec.descriptionAr : rec.descriptionEn}
                      </p>

                      {rec.targetConcept && (
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-indigo-300 rounded font-medium border border-slate-700">
                            {isRtl ? 'المفهوم المستهدف:' : 'Target Concept:'} {rec.targetConcept}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {rec.lessonId && onNavigateLesson && (
                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        onClick={() => onNavigateLesson(rec.lessonId!)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium text-xs rounded-lg flex items-center gap-1.5 border border-indigo-500/30 transition"
                      >
                        <span>{isRtl ? 'الانتقال للدرس المعني' : 'Go to Lesson'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Learner Concept Mastery Profile Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>{isRtl ? 'ملف إتقان المفاهيم' : 'Concept Mastery Profile'}</span>
              </h4>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              {masteryList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 space-y-2">
                  <ShieldCheck className="w-6 h-6 text-indigo-400 mx-auto" />
                  <p>
                    {isRtl
                      ? 'سيتم قياس مستوى إتقان المفاهيم تلقائياً مع حل التقييمات التفاعلية والدروس.'
                      : 'Concept mastery is evaluated automatically as you attempt quizzes and exercises.'}
                  </p>
                </div>
              ) : (
                masteryList.map((m) => {
                  const scorePct = m.masteryScore;
                  const barColor =
                    scorePct >= 80 ? 'bg-emerald-500' : scorePct >= 50 ? 'bg-amber-500' : 'bg-rose-500';

                  return (
                    <div key={m.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300">{m.conceptKey}</span>
                        <span className="font-bold text-slate-100">{scorePct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} transition-all duration-500`}
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>
                          {isRtl ? 'المحاولات:' : 'Attempts:'} {m.totalAttempts}
                        </span>
                        <span>
                          {isRtl ? 'الإجابات الصحيحة:' : 'Correct:'} {m.correctAttempts}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
