import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Layers,
  Plus,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Award,
  UserPlus,
  ArrowRight
} from 'lucide-react';

interface OrgLearningViewProps {
  lang?: 'en' | 'ar';
}

export const OrgLearningView: React.FC<OrgLearningViewProps> = ({ lang = 'en' }) => {
  const isRtl = lang === 'ar';
  const [summary, setSummary] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProgModal, setShowProgModal] = useState(false);
  const [progTitleEn, setProgTitleEn] = useState('');
  const [progTitleAr, setProgTitleAr] = useState('');
  const [creatingProg, setCreatingProg] = useState(false);

  const [showCohortModal, setShowCohortModal] = useState(false);
  const [cohortNameEn, setCohortNameEn] = useState('');
  const [cohortNameAr, setCohortNameAr] = useState('');
  const [creatingCohort, setCreatingCohort] = useState(false);

  useEffect(() => {
    fetchOrgData();
  }, []);

  async function fetchOrgData() {
    setLoading(true);
    try {
      const [dashRes, progRes, chrtRes, asgnRes] = await Promise.all([
        fetch('/api/academy/org/dashboard'),
        fetch('/api/academy/org/programs'),
        fetch('/api/academy/org/cohorts'),
        fetch('/api/academy/org/assignments'),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setSummary(d.summary);
      }
      if (progRes.ok) {
        const p = await progRes.json();
        setPrograms(p.programs || []);
      }
      if (chrtRes.ok) {
        const c = await chrtRes.json();
        setCohorts(c.cohorts || []);
      }
      if (asgnRes.ok) {
        const a = await asgnRes.json();
        setAssignments(a.assignments || []);
      }
    } catch (err) {
      console.error('Failed to load organization learning data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!progTitleEn.trim() || !progTitleAr.trim()) return;

    setCreatingProg(true);
    try {
      const res = await fetch('/api/academy/org/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleEn: progTitleEn,
          titleAr: progTitleAr,
        }),
      });

      if (res.ok) {
        setShowProgModal(false);
        setProgTitleEn('');
        setProgTitleAr('');
        fetchOrgData();
      }
    } catch (err) {
      console.error('Failed to create program:', err);
    } finally {
      setCreatingProg(false);
    }
  }

  async function handleCreateCohort(e: React.FormEvent) {
    e.preventDefault();
    if (!cohortNameEn.trim() || !cohortNameAr.trim()) return;

    setCreatingCohort(true);
    try {
      const res = await fetch('/api/academy/org/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: cohortNameEn,
          nameAr: cohortNameAr,
        }),
      });

      if (res.ok) {
        setShowCohortModal(false);
        setCohortNameEn('');
        setCohortNameAr('');
        fetchOrgData();
      }
    } catch (err) {
      console.error('Failed to create cohort:', err);
    } finally {
      setCreatingCohort(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        {isRtl ? 'جاري تحميل برنامج التعلم المؤسسي...' : 'Loading Organization Learning...'}
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>{isRtl ? 'التعلم المؤسسي وتطوير الفرق' : 'Organization Learning & Enterprise Programs'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'توجيه البرامج التدريبية للفرق، إدارة الدفعات، وتتبع تقدم الموظفين.'
              : 'Structure enterprise learning pathways, manage team cohorts, and assign mandatory training.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProgModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'برنامج تعليمي جديد' : 'New Program'}</span>
          </button>

          <button
            onClick={() => setShowCohortModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isRtl ? 'دفعة جديدة' : 'New Cohort'}</span>
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'البرامج التدريبية' : 'Learning Programs'}</div>
          <div className="text-2xl font-bold text-white mt-2">{summary?.totalPrograms || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'الدفعات والمجموعات' : 'Team Cohorts'}</div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">{summary?.totalCohorts || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'التكليفات النشطة' : 'Active Assignments'}</div>
          <div className="text-2xl font-bold text-indigo-400 mt-2">{summary?.totalAssignments || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'إجمالي شهادات الإنجاز' : 'Total Certificates'}</div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{summary?.totalCertificates || 0}</div>
        </div>
      </div>

      {/* Programs and Cohorts Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Programs */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{isRtl ? 'برامج التعلم المعتمدة' : 'Organization Learning Pathways'}</span>
          </h3>

          {programs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              {isRtl ? 'لا توجد برامج مؤسسية مخصصة بعد.' : 'No organization programs configured yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {programs.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">{isRtl ? p.titleAr : p.titleEn}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Created by {p.createdById.substring(0, 8)}</div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    PUBLISHED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cohorts */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>{isRtl ? 'دفعات الفرق والموظفين' : 'Employee Cohorts'}</span>
          </h3>

          {cohorts.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              {isRtl ? 'لا توجد دفعات منشأة بعد.' : 'No employee cohorts created yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {cohorts.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">{isRtl ? c.nameAr : c.nameEn}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Program Modal */}
      {showProgModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">{isRtl ? 'إنشاء برنامج تعليمي مؤسسي' : 'Create Organization Program'}</h3>

            <form onSubmit={handleCreateProgram} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Program Title (English)</label>
                <input
                  type="text"
                  required
                  value={progTitleEn}
                  onChange={(e) => setProgTitleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Leadership Development Track"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">عنوان البرنامج (بالعربية)</label>
                <input
                  type="text"
                  required
                  value={progTitleAr}
                  onChange={(e) => setProgTitleAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  placeholder="مثال: مسار التطوير القيادي"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProgModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProg}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-500"
                >
                  {creatingProg ? 'Creating...' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cohort Modal */}
      {showCohortModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">{isRtl ? 'إنشاء دفعة فرق عمل' : 'Create Employee Cohort'}</h3>

            <form onSubmit={handleCreateCohort} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Cohort Name (English)</label>
                <input
                  type="text"
                  required
                  value={cohortNameEn}
                  onChange={(e) => setCohortNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Q1 Engineering Leads"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">اسم الدفعة (بالعربية)</label>
                <input
                  type="text"
                  required
                  value={cohortNameAr}
                  onChange={(e) => setCohortNameAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="مثال: قادة الهندسة - الربع الأول"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCohortModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCohort}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
                >
                  {creatingCohort ? 'Creating...' : 'Create Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
