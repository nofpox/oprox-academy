import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  BookOpen,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  FileText
} from 'lucide-react';

interface AcademyAdminViewProps {
  lang?: 'en' | 'ar';
}

export const AcademyAdminView: React.FC<AcademyAdminViewProps> = ({ lang = 'en' }) => {
  const isRtl = lang === 'ar';
  const [overview, setOverview] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    setUnauthorized(false);
    try {
      const [ovRes, crsRes, instRes] = await Promise.all([
        fetch('/api/academy/admin/overview'),
        fetch('/api/academy/admin/courses'),
        fetch('/api/academy/admin/instructors'),
      ]);

      if (ovRes.status === 403 || crsRes.status === 403) {
        setUnauthorized(true);
        return;
      }

      if (ovRes.ok) {
        const d = await ovRes.json();
        setOverview(d.overview);
      }
      if (crsRes.ok) {
        const c = await crsRes.json();
        setCourses(c.courses || []);
      }
      if (instRes.ok) {
        const i = await instRes.json();
        setInstructors(i.instructors || []);
      }
    } catch (err) {
      console.error('Failed to load Academy Admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleModerateStatus(courseId: string, status: string) {
    try {
      const res = await fetch(`/api/academy/admin/courses/${courseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: `Moderated via Admin Studio to ${status}` }),
      });

      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update course status:', err);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        {isRtl ? 'جاري تحميل لوحة إدارة الأكاديمية...' : 'Loading Academy Administration...'}
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-white">
          {isRtl ? 'غير مصرح للوصول للوحة الإدارة العليا' : 'Admin Authorization Required'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {isRtl
            ? 'تتطلب هذه الصفحة صلاحيات المشرف العام (superadmin أو admin) للإشراف على الدورات والمعلمين.'
            : 'Accessing system oversight and moderation requires superadmin or admin privileges.'}
        </p>
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>{isRtl ? 'إدارة الأكاديمية والرقابة العليا' : 'Academy Administration & Oversight'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'مراجعة كافة الدورات، المعتمدين، واعتماد أو تعليق المحتوى.'
              : 'System-wide governance, moderation, course approvals, and instructor auditing.'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'إجمالي الدورات بالمحيط' : 'Total System Courses'}</div>
          <div className="text-2xl font-bold text-white mt-2">{overview?.totalCourses || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'دورات قيد التدقيق / المسودة' : 'Draft / In Review'}</div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{overview?.draftCourses || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'عدد المعلمين المعتمدين' : 'Total Instructors'}</div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">{overview?.totalInstructors || 0}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">{isRtl ? 'الشهادات الصادرة' : 'Issued Certificates'}</div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{overview?.totalCertificates || 0}</div>
        </div>
      </div>

      {/* All Courses Governance */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>{isRtl ? 'رقابة واعتماء الدورات التعليمية' : 'Course Moderation & Governance'}</span>
        </h3>

        {courses.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            {isRtl ? 'لا توجد دورات مسجلة في النظام.' : 'No courses found in system.'}
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{isRtl ? c.titleAr : c.titleEn}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        c.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Instructor: {c.instructorId.substring(0, 10)} | ID: {c.id}</div>
                </div>

                <div className="flex items-center gap-2">
                  {c.status !== 'PUBLISHED' ? (
                    <button
                      onClick={() => handleModerateStatus(c.id, 'PUBLISHED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all"
                    >
                      Approve & Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleModerateStatus(c.id, 'DRAFT')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all"
                    >
                      Unpublish to Draft
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
