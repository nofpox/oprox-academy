import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldCheck, Download, ExternalLink, AlertCircle, Sparkles, Search, FileText } from 'lucide-react';

interface CertificatesViewProps {
  isRtl?: boolean;
  myEnrollments: any[];
}

export function CertificatesView({ isRtl, myEnrollments }: CertificatesViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  // Eligibility checking for enrolled courses
  const [checkingCourseId, setCheckingCourseId] = useState<string | null>(null);
  const [eligibilityData, setEligibilityData] = useState<Record<string, any>>({});
  const [issuingCourseId, setIssuingCourseId] = useState<string | null>(null);

  // Public Verification Search
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  useEffect(() => {
    loadCertificates();
    checkAllEligibility();
  }, [myEnrollments]);

  async function loadCertificates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/academy/certificates');
      const data = await res.json();
      if (res.ok && data.success) {
        setCertificates(data.certificates || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  }

  async function checkAllEligibility() {
    for (const enr of myEnrollments) {
      try {
        const res = await fetch(`/api/academy/courses/${enr.courseId}/certificate/eligibility`);
        const data = await res.json();
        if (res.ok && data.success) {
          setEligibilityData((prev) => ({
            ...prev,
            [enr.courseId]: data.eligibility,
          }));
        }
      } catch (e) {
        // ignore individual eligibility check error
      }
    }
  }

  async function handleIssueCertificate(courseId: string) {
    setIssuingCourseId(courseId);
    setError(null);
    try {
      const res = await fetch(`/api/academy/courses/${courseId}/certificate/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedCert(data.certificate);
        await loadCertificates();
        await checkAllEligibility();
      } else {
        setError(data.error || 'Failed to issue certificate.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error issuing certificate.');
    } finally {
      setIssuingCourseId(null);
    }
  }

  async function handleVerifyCode() {
    if (!verifyCodeInput.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/academy/certificates/verify/${encodeURIComponent(verifyCodeInput.trim())}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyResult(data.verification);
      } else {
        setVerifyResult({ valid: false, error: 'Failed to verify' });
      }
    } catch (err: any) {
      setVerifyResult({ valid: false, error: 'Verification network error' });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Certificates & Verifications Hero Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Award className="w-4 h-4" />
            <span>{isRtl ? 'الشهادات والاعتمادات الموثوقة' : 'Verified Digital Certifications'}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            {isRtl ? 'شهادات الإنجاز واكتمال المسارات' : 'Certificates of Completion'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isRtl
              ? 'احصل على شهادات رسمية موثقة برقم تسلسلي ورمز تحقق عام بعد إكمال كافة متطلبات واختبارات الدورة.'
              : 'Earn cryptographically verifiable certificates upon meeting all course completion requirements and assessment standards.'}
          </p>
        </div>
      </div>

      {/* Public Code Verification Input */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isRtl ? 'التحقق العام من صحة شهادة' : 'Public Certificate Verification'}</span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={verifyCodeInput}
              onChange={(e) => setVerifyCodeInput(e.target.value)}
              placeholder={isRtl ? 'أدخل رمز التحقق (e.g., CERT-OPROX-...)' : 'Enter verification code (e.g., CERT-OPROX-...)'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleVerifyCode}
            disabled={verifying || !verifyCodeInput.trim()}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            {verifying ? (isRtl ? 'جاري التحقق...' : 'Verifying...') : (isRtl ? 'التحقق الآن' : 'Verify Code')}
          </button>
        </div>

        {/* Verification Result Display */}
        {verifyResult && (
          <div
            className={`p-4 rounded-xl border text-xs font-medium ${
              verifyResult.valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {verifyResult.valid ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isRtl ? 'الشهادة موثوقة وسارية المفعول ✓' : 'Certificate Valid & Authenticated ✓'}</span>
                </div>
                <p>
                  {isRtl ? 'الدورة: ' : 'Course: '}{isRtl ? verifyResult.certificate?.courseTitleAr || verifyResult.certificate?.courseTitleEn : verifyResult.certificate?.courseTitleEn}
                </p>
                <p className="text-[11px] opacity-80">
                  {isRtl ? 'تاريخ الإصدار: ' : 'Issued At: '}{new Date(verifyResult.certificate?.issuedAt).toLocaleDateString()} • {verifyResult.certificate?.certificateNumber}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{isRtl ? 'رمز التحقق غير صحيح أو غائب.' : 'Invalid or non-existent certificate code.'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Earned Certificates Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>{isRtl ? 'شهاداتي المكتسبة' : 'My Earned Certificates'} ({certificates.length})</span>
        </h3>

        {loading ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-400">
            {isRtl ? 'جاري تحميل الشهادات...' : 'Loading certificates...'}
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
            <Award className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400">
              {isRtl ? 'لم تقم بإصدار أي شهادة بعد. أكمل دوراتك واجتز الاختبارات للحصول عليها!' : 'No certificates issued yet. Complete your courses to earn certifications!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-4 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {cert.certificateNumber}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isRtl ? cert.courseTitleAr || cert.courseTitleEn : cert.courseTitleEn}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isRtl ? 'صدرت بتاريخ: ' : 'Issued on: '}{new Date(cert.issuedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-emerald-400 font-bold text-[11px]">
                    {isRtl ? 'نسبة الإنجاز: ' : 'Completion: '}{cert.completionPercent}%
                  </span>
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="flex items-center gap-1 font-bold text-xs text-emerald-400 hover:underline"
                  >
                    <span>{isRtl ? 'عرض الشهادة' : 'View Certificate'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eligible Courses for Certificate Issuance */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{isRtl ? 'الأهلية لإصدار الشهادات' : 'Certificate Issuance Eligibility'}</span>
        </h3>

        <div className="divide-y divide-slate-800 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          {myEnrollments.map((enr) => {
            const eligibility = eligibilityData[enr.courseId];
            const isEligible = eligibility?.eligible === true;
            const alreadyIssued = certificates.some((c) => c.courseId === enr.courseId);

            return (
              <div key={enr.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {isRtl ? enr.course?.titleAr || enr.course?.titleEn : enr.course?.titleEn}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isRtl ? 'التقدم في الدورة: ' : 'Course Progress: '}{enr.progressPercent}%
                  </p>
                </div>

                <div>
                  {alreadyIssued ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {isRtl ? 'تم إصدار الشهادة ✓' : 'Certificate Issued ✓'}
                    </span>
                  ) : isEligible ? (
                    <button
                      onClick={() => handleIssueCertificate(enr.courseId)}
                      disabled={issuingCourseId === enr.courseId}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md shadow-emerald-500/20"
                    >
                      {issuingCourseId === enr.courseId ? (isRtl ? 'جاري الإصدار...' : 'Issuing...') : (isRtl ? 'إصدار الشهادة الآن' : 'Claim Certificate')}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      {isRtl ? 'أكمل 100% من الدورة لفتح الشهادة' : 'Reach 100% completion to unlock'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certificate Display Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl relative text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/30">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                {isRtl ? 'شهادة إنجاز معتمدة' : 'Official Certificate of Achievement'}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {isRtl ? selectedCert.courseTitleAr || selectedCert.courseTitleEn : selectedCert.courseTitleEn}
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {isRtl
                  ? 'تشهد أوب روكس أكاديمي بأن المتعلم قد أتم بنجاح كافة المساقات والتقييمات المطلوبة لهذه الدورة.'
                  : 'This certifies that the learner has successfully fulfilled all technical coursework and assessment requirements.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{isRtl ? 'رقم الشهادة' : 'Certificate No.'}</span>
                <span className="font-mono font-bold text-emerald-400">{selectedCert.certificateNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{isRtl ? 'رمز التحقق' : 'Verification Code'}</span>
                <span className="font-mono font-bold text-emerald-400">{selectedCert.verificationCode}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
