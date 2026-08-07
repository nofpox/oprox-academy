import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  BookOpen,
  FileCheck2,
  TrendingUp,
  Award,
  Layers,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
  Send,
  Users
} from 'lucide-react';

interface InstructorStudioViewProps {
  lang?: 'en' | 'ar';
}

export const InstructorStudioView: React.FC<InstructorStudioViewProps> = ({ lang = 'en' }) => {
  const isRtl = lang === 'ar';
  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state for creating course
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [level, setLevel] = useState('ALL_LEVELS');
  const [priceSar, setPriceSar] = useState('0.00');
  const [savingCourse, setSavingCourse] = useState(false);

  // Grade Modal state
  const [gradingSub, setGradingSub] = useState<any>(null);
  const [score, setScore] = useState(100);
  const [feedback, setFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  useEffect(() => {
    fetchInstructorData();
  }, []);

  async function fetchInstructorData() {
    setLoading(true);
    try {
      const [dashRes, crsRes, subRes] = await Promise.all([
        fetch('/api/academy/instructor/dashboard'),
        fetch('/api/academy/instructor/courses'),
        fetch('/api/academy/instructor/submissions'),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setStats(d.stats);
      }
      if (crsRes.ok) {
        const c = await crsRes.json();
        setCourses(c.courses || []);
      }
      if (subRes.ok) {
        const s = await subRes.json();
        setSubmissions(s.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load instructor studio data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!titleEn.trim() || !titleAr.trim()) return;

    setSavingCourse(true);
    try {
      const res = await fetch('/api/academy/instructor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleEn,
          titleAr,
          summaryEn,
          level,
          priceSar,
          status: 'DRAFT',
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setTitleEn('');
        setTitleAr('');
        setSummaryEn('');
        fetchInstructorData();
      }
    } catch (err) {
      console.error('Error creating course:', err);
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleGradeSubmission(e: React.FormEvent) {
    e.preventDefault();
    if (!gradingSub) return;

    setSubmittingGrade(true);
    try {
      const res = await fetch(`/api/academy/assignments/submissions/${gradingSub.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scorePercent: Number(score),
          feedback,
          status: 'GRADED',
        }),
      });

      if (res.ok) {
        setGradingSub(null);
        fetchInstructorData();
      }
    } catch (err) {
      console.error('Failed to grade submission:', err);
    } finally {
      setSubmittingGrade(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        {isRtl ? 'جاري تحميل استوديو المعلم...' : 'Loading Instructor Studio...'}
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-400" />
            <span>{isRtl ? 'استوديو المعلم ومنشئ المحتوى' : 'Instructor Studio'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'إدارة دوراتك، إنشاء المناهج، وتقييم واجبات الطلاب.'
              : 'Author courses, build modules, grade learner submissions, and track enrollment performance.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? 'إنشاء دورة جديدة' : 'Create New Course'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'إجمالي الدورات' : 'Total Courses'}</div>
          <div className="text-2xl font-bold text-white mt-2">{stats?.totalCourses || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'الدورات المنشورة' : 'Published Courses'}</div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{stats?.publishedCourses || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'إجمالي الطلاب المسجلين' : 'Total Enrollments'}</div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">{stats?.totalEnrollments || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'واجبات بانتظار التقييم' : 'Pending Grading'}</div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats?.pendingSubmissionsCount || 0}</div>
        </div>
      </div>

      {/* Instructor Courses List */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>{isRtl ? 'دوراتي التعليمية' : 'My Courses'}</span>
        </h3>

        {courses.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            {isRtl ? 'لم تقم بإنشاء أي دورات بعد. انقر على "إنشاء دورة جديدة" للبدء.' : 'No courses authored yet. Click "Create New Course" to start.'}
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{isRtl ? c.titleAr : c.titleEn}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        c.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{c.summaryEn || c.summaryAr || 'No summary provided.'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{c.priceSar} SAR</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions to Grade */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-amber-400" />
          <span>{isRtl ? 'تسليمات الواجبات للتقييم' : 'Learner Submissions to Grade'}</span>
        </h3>

        {submissions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            {isRtl ? 'لا توجد تسليمات معلقة للتقييم حالياً.' : 'No pending learner submissions to grade right now.'}
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-semibold text-white">Learner ID: {sub.userId.substring(0, 12)}...</div>
                  <div className="text-xs text-slate-400 mt-0.5">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded ${sub.status === 'GRADED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {sub.status}
                  </span>
                </div>

                <button
                  onClick={() => setGradingSub(sub)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-all self-start sm:self-auto"
                >
                  {isRtl ? 'تقييم الواجب' : 'Grade Submission'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">{isRtl ? 'إنشاء دورة تعليمية جديدة' : 'Create New Course'}</h3>

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Course Title (English)</label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Real Estate Finance"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">عنوان الدورة (بالعربية)</label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="مثال: التمويل العقاري"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Course Summary</label>
                <textarea
                  rows={2}
                  value={summaryEn}
                  onChange={(e) => setSummaryEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="ALL_LEVELS">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Price (SAR)</label>
                  <input
                    type="text"
                    value={priceSar}
                    onChange={(e) => setPriceSar(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
                >
                  {savingCourse ? 'Saving...' : 'Save Draft Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">{isRtl ? 'تقييم واجب الطالب' : 'Grade Assignment Submission'}</h3>

            <form onSubmit={handleGradeSubmission} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Score Percent (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Instructor Feedback</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Provide constructive feedback..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGrade}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
                >
                  {submittingGrade ? 'Submitting...' : 'Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
