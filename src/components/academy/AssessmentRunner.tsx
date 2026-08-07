import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, AlertCircle, RotateCcw, Clock, Award, ChevronRight, ChevronLeft } from 'lucide-react';

interface AssessmentRunnerProps {
  courseId: string;
  lessonId?: string;
  isRtl?: boolean;
  onQuizPassed?: () => void;
}

export function AssessmentRunner({ courseId, lessonId, isRtl, onQuizPassed }: AssessmentRunnerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<any>(null);

  // Form State for active attempt
  const [answers, setAnswers] = useState<Record<string, { selectedChoiceIds?: string[]; shortAnswerText?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadAssessment();
  }, [courseId, lessonId]);

  async function loadAssessment() {
    setLoading(true);
    setError(null);
    try {
      // Fetch assessments for this course
      const res = await fetch(`/api/academy/courses/${courseId}/assessments`);
      const data = await res.json();

      let targetAsmt = null;
      if (res.ok && data.success && data.assessments && data.assessments.length > 0) {
        if (lessonId) {
          targetAsmt = data.assessments.find((a: any) => a.lessonId === lessonId) || data.assessments[0];
        } else {
          targetAsmt = data.assessments[0];
        }
      }

      // If no assessment exists yet for this lesson/course, create a default quiz!
      if (!targetAsmt) {
        const createRes = await fetch('/api/academy/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            lessonId,
            titleEn: 'Comprehensive Lesson Assessment',
            titleAr: 'تقييم شامل لمفاهيم الدرس',
            descriptionEn: 'Test your understanding of the concepts covered in this module.',
            descriptionAr: 'اختبر فهمك واستيعابك للمفاهيم المذكورة في هذا الوحدة التعليمية.',
            passingScorePercent: 70,
            maxAttempts: 3,
          }),
        });
        const createData = await createRes.json();
        if (createRes.ok && createData.success) {
          targetAsmt = createData.assessment;

          // Add default questions
          const q1 = await fetch(`/api/academy/assessments/${targetAsmt.id}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionTextEn: 'What is the primary objective of this architecture?',
              questionTextAr: 'ما هو الهدف الرئيسي من هذه المعمارية المعتمدة؟',
              questionType: 'SINGLE_CHOICE',
              points: 1,
              displayOrder: 1,
            }),
          }).then((r) => r.json());

          if (q1.success && q1.question) {
            await fetch(`/api/academy/questions/${q1.question.id}/choices`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ choiceTextEn: 'Ensure high reliability and modularity', choiceTextAr: 'ضمان الاعتمادية العالية والنمطية', isCorrect: true, displayOrder: 1 }),
            });
            await fetch(`/api/academy/questions/${q1.question.id}/choices`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ choiceTextEn: 'Bypass authorization rules', choiceTextAr: 'تجاوز قواعد الصلاحيات', isCorrect: false, displayOrder: 2 }),
            });
            await fetch(`/api/academy/questions/${q1.question.id}/choices`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ choiceTextEn: 'Disable data encryption', choiceTextAr: 'تعطيل تشفير البيانات', isCorrect: false, displayOrder: 3 }),
            });
          }

          const q2 = await fetch(`/api/academy/assessments/${targetAsmt.id}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionTextEn: 'Is server-side evaluation strictly required for scoring integrity?',
              questionTextAr: 'هل التقييم من جانب الخادم مطلوب بصرامة لضمان نزاهة الدرجات؟',
              questionType: 'TRUE_FALSE',
              points: 1,
              displayOrder: 2,
            }),
          }).then((r) => r.json());

          if (q2.success && q2.question) {
            await fetch(`/api/academy/questions/${q2.question.id}/choices`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ choiceTextEn: 'True', choiceTextAr: 'صحيح', isCorrect: true, displayOrder: 1 }),
            });
            await fetch(`/api/academy/questions/${q2.question.id}/choices`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ choiceTextEn: 'False', choiceTextAr: 'خطأ', isCorrect: false, displayOrder: 2 }),
            });
          }
        }
      }

      if (targetAsmt) {
        setAssessment(targetAsmt);
        // Fetch questions and choices (without correct answers exposed!)
        const detailRes = await fetch(`/api/academy/assessments/${targetAsmt.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok && detailData.success) {
          setQuestions(detailData.questions || []);
        }

        // Fetch attempts
        const attRes = await fetch(`/api/academy/assessments/${targetAsmt.id}/attempts`);
        const attData = await attRes.json();
        if (attRes.ok && attData.success) {
          setAttempts(attData.attempts || []);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load assessment.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartAttempt() {
    if (!assessment) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    try {
      const res = await fetch(`/api/academy/assessments/${assessment.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveAttempt(data.attempt);
      } else {
        setError(data.error || 'Could not start attempt.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to start attempt.');
    } finally {
      setLoading(false);
    }
  }

  function handleChoiceSelect(questionId: string, choiceId: string, questionType: string) {
    if (questionType === 'SINGLE_CHOICE' || questionType === 'TRUE_FALSE') {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { selectedChoiceIds: [choiceId] },
      }));
    } else if (questionType === 'MULTIPLE_CHOICE') {
      setAnswers((prev) => {
        const current = prev[questionId]?.selectedChoiceIds || [];
        const exists = current.includes(choiceId);
        const updated = exists ? current.filter((id) => id !== choiceId) : [...current, choiceId];
        return {
          ...prev,
          [questionId]: { selectedChoiceIds: updated },
        };
      });
    }
  }

  function handleShortAnswerChange(questionId: string, text: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { shortAnswerText: text },
    }));
  }

  async function handleSubmitAttempt() {
    if (!activeAttempt) return;
    setSubmitting(true);
    setError(null);

    const answerPayload = Object.entries(answers).map(([qId, val]) => ({
      questionId: qId,
      selectedChoiceIds: val.selectedChoiceIds,
      shortAnswerText: val.shortAnswerText,
    }));

    try {
      const res = await fetch(`/api/academy/attempts/${activeAttempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerPayload }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        setActiveAttempt(null);
        // Refresh attempts list
        const attRes = await fetch(`/api/academy/assessments/${assessment.id}/attempts`);
        const attData = await attRes.json();
        if (attRes.ok && attData.success) {
          setAttempts(attData.attempts || []);
        }

        if (data.passed && onQuizPassed) {
          onQuizPassed();
        }
      } else {
        setError(data.error || 'Failed to submit attempt.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error submitting attempt.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">
          {isRtl ? 'جاري تحميل الاختبار التقييمي...' : 'Loading assessment engine...'}
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
        <button
          onClick={loadAssessment}
          className="px-4 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700"
        >
          {isRtl ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!assessment) return null;

  // Active attempt quiz form view
  if (activeAttempt) {
    return (
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {isRtl ? `المحاولة رقم ${activeAttempt.attemptNumber}` : `Attempt #${activeAttempt.attemptNumber}`}
            </span>
            <h2 className="text-lg font-bold text-white">
              {isRtl ? assessment.titleAr : assessment.titleEn}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{isRtl ? 'درجة النجاح: ' : 'Passing Score: '}{assessment.passingScorePercent}%</span>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-6">
          {questions.map((qObj, idx) => {
            const question = qObj.question;
            const choices = qObj.choices || [];
            const currentAns = answers[question.id] || {};

            return (
              <div key={question.id} className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-200">
                    <span className="text-cyan-400 mr-2">{idx + 1}.</span>
                    {isRtl ? question.questionTextAr : question.questionTextEn}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {question.points} {isRtl ? 'نقاط' : 'pts'}
                  </span>
                </div>

                {/* Choices or Short Answer */}
                {question.questionType === 'SHORT_ANSWER' ? (
                  <input
                    type="text"
                    value={currentAns.shortAnswerText || ''}
                    onChange={(e) => handleShortAnswerChange(question.id, e.target.value)}
                    placeholder={isRtl ? 'اكتب إجابتك هنا...' : 'Type your answer here...'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                ) : (
                  <div className="space-y-2">
                    {choices.map((choice: any) => {
                      const isSelected = (currentAns.selectedChoiceIds || []).includes(choice.id);
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleChoiceSelect(question.id, choice.id, question.questionType)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-medium border transition-all text-left ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{isRtl ? choice.choiceTextAr : choice.choiceTextEn}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSubmitAttempt}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {submitting ? (
              <span>{isRtl ? 'جاري التقييم...' : 'Evaluating Answers...'}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRtl ? 'إرسال ونيل النتيجة' : 'Submit Assessment'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Quiz Summary & Start Attempt View
  const lastAttempt = attempts.length > 0 ? attempts[0] : null;
  const bestAttempt = attempts.reduce(
    (best, curr) => (!best || curr.scorePercent > best.scorePercent ? curr : best),
    null
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Award className="w-4 h-4" />
            <span>{isRtl ? 'اختبار النزاهة والتقييم' : 'Verified Knowledge Assessment'}</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {isRtl ? assessment.titleAr : assessment.titleEn}
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            {isRtl ? assessment.descriptionAr : assessment.descriptionEn}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartAttempt}
            disabled={assessment.maxAttempts && attempts.length >= assessment.maxAttempts}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl hover:from-cyan-400 hover:to-teal-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>
              {attempts.length === 0
                ? isRtl
                  ? 'بدء الاختبار الآن'
                  : 'Start Assessment'
                : isRtl
                ? 'إعادة الاختبار'
                : 'Retake Assessment'}
            </span>
          </button>
        </div>
      </div>

      {/* Result Display Banner */}
      {result && (
        <div
          className={`p-6 rounded-xl border flex items-start gap-4 ${
            result.passed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {result.passed ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h3 className="text-sm font-bold">
              {result.passed
                ? isRtl
                  ? 'مبروك! لقد اجتزت الاختبار بنجاح 🎉'
                  : 'Congratulations! You passed the assessment 🎉'
                : isRtl
                ? 'لم تتجاوز درجة النجاح المطلوبة. يمكنك إعادة المحاولة.'
                : 'Did not meet the passing score threshold. You can retake.'}
            </h3>
            <p className="text-xs opacity-90">
              {isRtl ? 'النتيجة المحرزة: ' : 'Achieved Score: '}{result.scorePercent}% ({result.scorePoints} / {result.maxPoints} {isRtl ? 'نقاط' : 'pts'})
            </p>
          </div>
        </div>
      )}

      {/* Attempt History List */}
      {attempts.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isRtl ? 'سجل المحاولات والنتائج' : 'Attempt History & Scores'}
          </h3>
          <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            {attempts.map((att) => (
              <div key={att.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      att.passed ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-red-400'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-white">
                      {isRtl ? `محاولة #${att.attemptNumber}` : `Attempt #${att.attemptNumber}`}
                    </span>
                    <span className="text-slate-500 ml-2">
                      {new Date(att.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-sm text-slate-200">
                    {att.scorePercent}%
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      att.passed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {att.passed ? (isRtl ? 'ناجح' : 'PASSED') : (isRtl ? 'غير مجتاز' : 'FAILED')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
