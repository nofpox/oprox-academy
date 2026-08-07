import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle2, Clock, AlertCircle, Link as LinkIcon, MessageSquare } from 'lucide-react';

interface AssignmentRunnerProps {
  courseId: string;
  lessonId?: string;
  isRtl?: boolean;
}

export function AssignmentRunner({ courseId, lessonId, isRtl }: AssignmentRunnerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);

  const [submissionText, setSubmissionText] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAssignment();
  }, [courseId, lessonId]);

  async function loadAssignment() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/academy/courses/${courseId}/assignments`);
      const data = await res.json();

      let targetAsgn = null;
      if (res.ok && data.success && data.assignments && data.assignments.length > 0) {
        if (lessonId) {
          targetAsgn = data.assignments.find((a: any) => a.lessonId === lessonId) || data.assignments[0];
        } else {
          targetAsgn = data.assignments[0];
        }
      }

      // Default assignment if none exists yet
      if (!targetAsgn) {
        const createRes = await fetch('/api/academy/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            lessonId,
            titleEn: 'Practical Architecture Implementation Project',
            titleAr: 'مشروع التطبيق العملي لمعمارية النظام',
            instructionsEn: 'Submit your code summary, architectural diagram rationale, or external repo URL for instructor grading.',
            instructionsAr: 'قم بتقديم ملخص الكود ورسم معمارية النظام والرابط الخارجي للتقييم المباشر من المحاضر.',
            maxScore: 100,
            passingScore: 60,
          }),
        });
        const createData = await createRes.json();
        if (createRes.ok && createData.success) {
          targetAsgn = createData.assignment;
        }
      }

      if (targetAsgn) {
        setAssignment(targetAsgn);

        // Fetch user submission
        const subRes = await fetch(`/api/academy/assignments/${targetAsgn.id}`);
        const subData = await subRes.json();
        if (subRes.ok && subData.success && subData.submission) {
          setSubmission(subData.submission);
          setSubmissionText(subData.submission.submissionText || '');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load assignment.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!assignment || !submissionText.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const links = resourceLink.trim() ? [resourceLink.trim()] : [];

    try {
      const res = await fetch(`/api/academy/assignments/${assignment.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionText: submissionText.trim(),
          resourceUrls: links,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmission(data.submission);
        setSuccessMsg(isRtl ? 'تم تقديم التكليف بنجاح لتقييم المحاضر.' : 'Assignment submitted successfully for instructor review.');
      } else {
        setError(data.error || 'Failed to submit assignment.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error submitting assignment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">
          {isRtl ? 'جاري تحميل نظام التكاليف...' : 'Loading assignment module...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <FileText className="w-4 h-4" />
            <span>{isRtl ? 'التكليف والمشروع التطبيقي' : 'Practical Course Assignment'}</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {isRtl ? assignment.titleAr : assignment.titleEn}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            {isRtl ? assignment.instructionsAr : assignment.instructionsEn}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>{isRtl ? 'الدرجة القصوى: ' : 'Max Score: '}{assignment.maxScore}</span>
            <span className="mx-2">•</span>
            <span className="text-indigo-400 font-bold">{isRtl ? 'النجاح: ' : 'Pass: '}{assignment.passingScore}</span>
          </div>
        </div>
      </div>

      {/* Submission Feedback or Status */}
      {submission && (
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{isRtl ? 'حالة التكليف المقدم:' : 'Submission Status:'}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  submission.status === 'GRADED'
                    ? submission.score >= assignment.passingScore
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {submission.status}
              </span>
            </div>

            {submission.score !== null && (
              <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                {isRtl ? 'الدرجة: ' : 'Score: '}{submission.score} / {assignment.maxScore}
              </div>
            )}
          </div>

          {/* Instructor Feedback */}
          {(submission.instructorFeedbackEn || submission.instructorFeedbackAr) && (
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isRtl ? 'ملاحظات وتوجيهات المحاضر:' : 'Instructor Feedback:'}</span>
              </div>
              <p className="text-slate-300">
                {isRtl ? submission.instructorFeedbackAr || submission.instructorFeedbackEn : submission.instructorFeedbackEn}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Submission Form */}
      <div className="space-y-4">
        <label className="block text-xs font-bold text-slate-300">
          {isRtl ? 'نص التكليف والملخص التنفيذي:' : 'Submission Narrative & Executive Summary:'}
        </label>
        <textarea
          rows={5}
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          placeholder={isRtl ? 'اكتب تفاصيل إجابتك ومشروعك هنا...' : 'Write your submission details and answers here...'}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
        />

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {isRtl ? 'رابط المورد أو المشروع (GitHub / Figma / Drive):' : 'Resource or Project Link (Safe URL):'}
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={resourceLink}
              onChange={(e) => setResourceLink(e.target.value)}
              placeholder="https://github.com/example/project"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || !submissionText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {submitting ? (
              <span>{isRtl ? 'جاري التقديم...' : 'Submitting...'}</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{submission ? (isRtl ? 'تحديث التقديم' : 'Update Submission') : (isRtl ? 'تقديم التكليف' : 'Submit Assignment')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
