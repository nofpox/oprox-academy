import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  clearAcademyMemoryStore,
  createCourse,
  createCourseModule,
  createLesson,
  enrollUserInCourse,
  recordLessonProgress,
  createAssessment,
  addQuestionToAssessment,
  addChoiceToQuestion,
  getAssessmentById,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  getLearnerAssessmentAttempts,
  createAssignment,
  submitAssignment,
  gradeAssignmentSubmission,
  getLearnerAssignmentSubmission,
  checkCertificateEligibility,
  issueCertificate,
  getLearnerCertificates,
  verifyCertificate,
} from '../src/lib/academy/academyStore';

describe('OPROX Academy — Phase 3: Assessments, Assignments & Certification', () => {
  const tenantId = 'tenant_p3_test';
  const userIdLearner = 'usr_learner_1';
  const userIdOther = 'usr_learner_2';
  const userIdInstructor = 'usr_instructor_1';

  beforeEach(() => {
    clearAcademyMemoryStore();
  });

  it('1. verifies migration file 0020 and journal index 20 registration', () => {
    const migrationPath = path.join(process.cwd(), 'drizzle', '0020_oprox_academy_phase3_tables.sql');
    expect(fs.existsSync(migrationPath)).toBe(true);

    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(migrationContent).toContain('acad_assessments');
    expect(migrationContent).toContain('acad_assessment_questions');
    expect(migrationContent).toContain('acad_assessment_choices');
    expect(migrationContent).toContain('acad_assessment_attempts');
    expect(migrationContent).toContain('acad_learner_answers');
    expect(migrationContent).toContain('acad_assignments');
    expect(migrationContent).toContain('acad_assignment_submissions');
    expect(migrationContent).toContain('acad_certificates');

    const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
    const journalData = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
    const entry20 = journalData.entries.find((e: any) => e.idx === 20);
    expect(entry20).toBeDefined();
    expect(entry20.tag).toBe('0020_oprox_academy_phase3_tables');
  });

  it('2. creates assessment, questions, and choices and strips correct answers for learners', async () => {
    const course = await createCourse({
      tenantId,
      titleEn: 'Advanced Systems Architecture',
      titleAr: 'معمارية الأنظمة المتقدمة',
      slug: 'adv-sys-arch',
      priceSar: '0',
    });

    const assessment = await createAssessment({
      tenantId,
      courseId: course.id,
      titleEn: 'System Design Quiz',
      titleAr: 'اختبار تصميم الأنظمة',
      passingScorePercent: 70,
      maxAttempts: 2,
    });

    expect(assessment.id).toBeDefined();
    expect(assessment.passingScorePercent).toBe(70);

    const question = await addQuestionToAssessment({
      tenantId,
      assessmentId: assessment.id,
      questionTextEn: 'Which layer enforces tenant isolation?',
      questionTextAr: 'أي طبقة تطبق عزل المستأجر؟',
      questionType: 'SINGLE_CHOICE',
      points: 10,
      explanationEn: 'Tenant ID must be checked at server boundary.',
    });

    const choice1 = await addChoiceToQuestion({
      tenantId,
      questionId: question.id,
      choiceTextEn: 'Server & Database Query Boundary',
      choiceTextAr: 'حدود استعلام الخادم وقاعدة البيانات',
      isCorrect: true,
    });

    const choice2 = await addChoiceToQuestion({
      tenantId,
      questionId: question.id,
      choiceTextEn: 'Client CSS Styling Layer',
      choiceTextAr: 'طبقة تنسيق العميل',
      isCorrect: false,
    });

    // Learner View: includeAnswers = false
    const learnerData = await getAssessmentById(tenantId, assessment.id, false);
    expect(learnerData).toBeDefined();
    expect(learnerData?.questions.length).toBe(1);
    const qLearner = learnerData!.questions[0];
    expect(qLearner.question.explanationEn).toBeFalsy(); // Stripped!
    expect(qLearner.choices[0].isCorrect).toBeFalsy(); // Stripped!

    // Instructor View: includeAnswers = true
    const instructorData = await getAssessmentById(tenantId, assessment.id, true);
    expect(instructorData?.questions[0].question.explanationEn).toBe('Tenant ID must be checked at server boundary.');
    expect(instructorData?.questions[0].choices[0].isCorrect).toBe(true);
  });

  it('3. starts attempt and evaluates server-side scoring accurately', async () => {
    const course = await createCourse({
      tenantId,
      titleEn: 'Database Engineering',
      titleAr: 'هندسة قواعد البيانات',
      slug: 'db-eng',
      priceSar: '0',
    });

    const assessment = await createAssessment({
      tenantId,
      courseId: course.id,
      titleEn: 'Indexing Quiz',
      titleAr: 'اختبار الفهرسة',
      passingScorePercent: 50,
      maxAttempts: 3,
    });

    const q1 = await addQuestionToAssessment({
      tenantId,
      assessmentId: assessment.id,
      questionTextEn: 'Does a B-Tree index speed up point lookups?',
      questionTextAr: 'هل يساعد فهرس B-Tree في تسريع الاستعلامات؟',
      questionType: 'SINGLE_CHOICE',
      points: 5,
    });

    const c1True = await addChoiceToQuestion({
      tenantId,
      questionId: q1.id,
      choiceTextEn: 'Yes',
      choiceTextAr: 'نعم',
      isCorrect: true,
    });

    const c1False = await addChoiceToQuestion({
      tenantId,
      questionId: q1.id,
      choiceTextEn: 'No',
      choiceTextAr: 'لا',
      isCorrect: false,
    });

    // Learner starts attempt
    const attempt = await startAssessmentAttempt(tenantId, userIdLearner, assessment.id);
    expect(attempt.attemptNumber).toBe(1);
    expect(attempt.status).toBe('IN_PROGRESS');

    // Submit correct answer
    const evalResult = await submitAssessmentAttempt(tenantId, userIdLearner, attempt.id, [
      {
        questionId: q1.id,
        selectedChoiceIds: [c1True.id],
      },
    ]);

    expect(evalResult.scorePercent).toBe(100);
    expect(evalResult.passed).toBe(true);
    expect(evalResult.attempt.status).toBe('SUBMITTED');

    // History verification
    const attempts = await getLearnerAssessmentAttempts(tenantId, userIdLearner, assessment.id);
    expect(attempts.length).toBe(1);
    expect(attempts[0].scorePercent).toBe(100);
  });

  it('4. enforces IDOR protection and max attempts limit on assessments', async () => {
    const course = await createCourse({
      tenantId,
      titleEn: 'Security Protocols',
      titleAr: 'بروتوكولات الأمان',
      slug: 'sec-proto',
      priceSar: '0',
    });

    const assessment = await createAssessment({
      tenantId,
      courseId: course.id,
      titleEn: 'Auth Quiz',
      titleAr: 'اختبار التوثيق',
      passingScorePercent: 80,
      maxAttempts: 1, // Max 1 attempt allowed
    });

    const attempt1 = await startAssessmentAttempt(tenantId, userIdLearner, assessment.id);

    // IDOR check: another user cannot submit attempt1
    await expect(
      submitAssessmentAttempt(tenantId, userIdOther, attempt1.id, [])
    ).rejects.toThrow('FORBIDDEN_ATTEMPT_OWNERSHIP');

    // Submit attempt 1
    await submitAssessmentAttempt(tenantId, userIdLearner, attempt1.id, []);

    // Attempting a second start should fail due to max attempts limit
    await expect(
      startAssessmentAttempt(tenantId, userIdLearner, assessment.id)
    ).rejects.toThrow('MAX_ATTEMPTS_REACHED');
  });

  it('5. handles assignments creation, submission, and instructor grading', async () => {
    const course = await createCourse({
      tenantId,
      titleEn: 'Full-Stack Development',
      titleAr: 'تطوير التطبيقات الكاملة',
      slug: 'fullstack-dev',
      priceSar: '0',
    });

    const assignment = await createAssignment({
      tenantId,
      courseId: course.id,
      titleEn: 'Capstone Project Submission',
      titleAr: 'تقديم مشروع التخرج',
      instructionsEn: 'Submit your GitHub link and architecture description.',
      instructionsAr: 'قدّم رابط مشروعك ووصف المعمارية.',
      maxScore: 100,
      passingScore: 60,
    });

    expect(assignment.maxScore).toBe(100);

    // Learner submits
    const sub = await submitAssignment(
      tenantId,
      userIdLearner,
      assignment.id,
      'I built the backend using Express and Drizzle ORM.',
      ['https://github.com/example/capstone']
    );

    expect(sub.status).toBe('SUBMITTED');
    expect(sub.submissionText).toContain('Express and Drizzle');

    // Instructor grades
    const gradedSub = await gradeAssignmentSubmission(
      tenantId,
      userIdInstructor,
      sub.id,
      95,
      'Excellent architecture and clean code structure.',
      'معمارية ممتازة وكود نظيف.'
    );

    expect(gradedSub.status).toBe('GRADED');
    expect(gradedSub.score).toBe(95);
    expect(gradedSub.instructorFeedbackEn).toContain('Excellent architecture');

    // Learner fetches their submission
    const learnerSub = await getLearnerAssignmentSubmission(tenantId, userIdLearner, assignment.id);
    expect(learnerSub?.score).toBe(95);
  });

  it('6. verifies certificate eligibility, issuance, and public verification code', async () => {
    const course = await createCourse({
      tenantId,
      titleEn: 'AI & Machine Learning Foundations',
      titleAr: 'أساسيات الذكاء الاصطناعي وتعلم الآلة',
      slug: 'ai-ml-foundations',
      priceSar: '0',
    });

    const mod = await createCourseModule({
      tenantId,
      courseId: course.id,
      titleEn: 'Module 1',
      titleAr: 'الوحدة 1',
    });

    const lsn = await createLesson({
      tenantId,
      courseId: course.id,
      moduleId: mod.id,
      titleEn: 'Neural Networks 101',
      titleAr: 'مقدمة للشبكات العصبية',
      lessonType: 'TEXT',
      durationMinutes: 15,
    });

    // Enroll learner
    await enrollUserInCourse(tenantId, userIdLearner, course.id);

    // Check eligibility before completing course (0% completed)
    const elBefore = await checkCertificateEligibility(tenantId, userIdLearner, course.id);
    expect(elBefore.eligible).toBe(false);
    expect(elBefore.completedLessons).toBe(false);

    // Mark lesson complete -> 100% completed
    await recordLessonProgress({
      tenantId,
      userId: userIdLearner,
      courseId: course.id,
      lessonId: lsn.id,
      completed: true,
    });

    // Check eligibility after completion
    const elAfter = await checkCertificateEligibility(tenantId, userIdLearner, course.id);
    expect(elAfter.eligible).toBe(true);
    expect(elAfter.completedLessons).toBe(true);

    // Issue Certificate
    const cert = await issueCertificate(tenantId, userIdLearner, course.id);
    expect(cert.certificateNumber).toContain('CERT-');
    expect(cert.verificationCode).toBeDefined();

    // Idempotent re-issuance returns same certificate
    const certAgain = await issueCertificate(tenantId, userIdLearner, course.id);
    expect(certAgain.id).toBe(cert.id);

    // List learner certificates
    const certsList = await getLearnerCertificates(tenantId, userIdLearner);
    expect(certsList.length).toBe(1);

    // Public Safe Verification without user context
    const verification = await verifyCertificate(cert.verificationCode);
    expect(verification.valid).toBe(true);
    expect(verification.certificateNumber).toBe(cert.certificateNumber);

    // Invalid verification code
    const invalidVerification = await verifyCertificate('INVALID-CODE-999');
    expect(invalidVerification.valid).toBe(false);
  });
});
