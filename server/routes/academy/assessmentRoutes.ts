// Assessments, assignments, certificates, instructor studio

import { Router } from 'express';
import { AuthRequest, requireAuth } from '../../auth';
import { logStructured } from '../../../src/lib/logger';
import { logSecurityAudit } from '../../audit';
import {
  getOrCreateAcademyProfile, updateAcademyProfile, createInstructorProfile,
  getInstructorProfile, listInstructors, createCategory, listCategories,
  createLearningPath, listLearningPaths, createCourse, updateCourse,
  listCourses, getCourseBySlugOrId, createCourseModule, listCourseModules,
  createLesson, listModuleLessons, createResource, listLessonResources,
  enrollUserInCourse, getUserEnrollments, getEnrollmentByCourse,
  recordLessonProgress, getCourseProgress, toggleBookmark, getUserBookmarks,
  getLearnerDashboardSummary, createAssessment, addQuestionToAssessment,
  addChoiceToQuestion, getAssessmentById, listAssessmentsByCourse,
  startAssessmentAttempt, submitAssessmentAttempt, getLearnerAssessmentAttempts,
  createAssignment, getAssignmentById, listAssignmentsByCourse, submitAssignment,
  getLearnerAssignmentSubmission, gradeAssignmentSubmission,
  checkCertificateEligibility, issueCertificate, getLearnerCertificates,
  verifyCertificate, deleteCourse, getInstructorCourses, getInstructorStats,
  getInstructorSubmissions, createOrgProgram, getOrgPrograms,
  addCourseToOrgProgram, createCohort, getCohorts, addCohortMember,
  getCohortMembers, assignOrgLearning, getOrgAssignments, getOrgProgressSummary,
  getAcademyAdminOverview, getAllCoursesAdmin, getAllInstructorsAdmin,
  logAdminAction, createTutorSession, getTutorSession, getUserTutorSessions,
  addTutorMessage, getSessionMessages, upsertLearnerMastery, getLearnerMastery,
  generateAdaptiveRecommendations, getAdaptiveRecommendations,
  dismissRecommendation, getOrCreateLabSession, getLabSession, submitLabSession,
  listLearnerLabSessions,
} from '../../../src/lib/academy/academyStore';
import { getTenantId } from './academyUtils';

const router = Router();

// ── Phase 3: Assessment & Quiz Routes ──────────────────────────────────────

// Create assessment (privileged/instructor)
router.post('/api/academy/assessments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { courseId, moduleId, lessonId, titleEn, titleAr, descriptionEn, descriptionAr, passingScorePercent, maxAttempts, timeLimitMinutes } = req.body;

    if (!courseId || !titleEn || !titleAr) {
      return res.status(400).json({ error: 'courseId, titleEn, titleAr are required.' });
    }

    const assessment = await createAssessment({
      tenantId,
      courseId,
      moduleId,
      lessonId,
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      passingScorePercent,
      maxAttempts,
      timeLimitMinutes,
    });

    logSecurityAudit('ACADEMY_ASSESSMENT_CREATED', req, { tenantId, assessmentId: assessment.id });
    res.json({ success: true, assessment });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_ASSESSMENT_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to create assessment.' });
  }
});

// Add question to assessment
router.post('/api/academy/assessments/:assessmentId/questions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { assessmentId } = req.params;
    const { questionTextEn, questionTextAr, questionType, points, displayOrder, explanationEn, explanationAr } = req.body;

    if (!questionTextEn || !questionTextAr) {
      return res.status(400).json({ error: 'questionTextEn and questionTextAr are required.' });
    }

    const question = await addQuestionToAssessment({
      tenantId,
      assessmentId,
      questionTextEn,
      questionTextAr,
      questionType,
      points,
      displayOrder,
      explanationEn,
      explanationAr,
    });

    res.json({ success: true, question });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADD_QUESTION_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to add question.' });
  }
});

// Add choice to question
router.post('/api/academy/questions/:questionId/choices', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { questionId } = req.params;
    const { choiceTextEn, choiceTextAr, isCorrect, displayOrder } = req.body;

    if (!choiceTextEn || !choiceTextAr) {
      return res.status(400).json({ error: 'choiceTextEn and choiceTextAr are required.' });
    }

    const choice = await addChoiceToQuestion({
      tenantId,
      questionId,
      choiceTextEn,
      choiceTextAr,
      isCorrect,
      displayOrder,
    });

    res.json({ success: true, choice });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADD_CHOICE_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to add choice.' });
  }
});

// List assessments for a course
router.get('/api/academy/courses/:courseId/assessments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { courseId } = req.params;

    const assessments = await listAssessmentsByCourse(tenantId, courseId);
    res.json({ success: true, assessments });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_LIST_ASSESSMENTS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve assessments.' });
  }
});

// Get assessment details (strips correct answers unless privileged)
router.get('/api/academy/assessments/:assessmentId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { assessmentId } = req.params;
    const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'superadmin' || (req.user?.role as any) === 'INSTRUCTOR';

    const data = await getAssessmentById(tenantId, assessmentId, isPrivileged);
    if (!data) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    res.json({ success: true, ...data });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_ASSESSMENT_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve assessment.' });
  }
});

// Start assessment attempt
router.post('/api/academy/assessments/:assessmentId/start', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { assessmentId } = req.params;

    const attempt = await startAssessmentAttempt(tenantId, userId, assessmentId);
    logSecurityAudit('ACADEMY_ATTEMPT_STARTED', req, { tenantId, assessmentId, attemptId: attempt.id });

    res.json({ success: true, attempt });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_START_ATTEMPT_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to start assessment attempt.' });
  }
});

// Submit assessment attempt
router.post('/api/academy/attempts/:attemptId/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { attemptId } = req.params;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers must be an array.' });
    }

    const result = await submitAssessmentAttempt(tenantId, userId, attemptId, answers);
    logSecurityAudit('ACADEMY_ATTEMPT_SUBMITTED', req, {
      tenantId,
      attemptId,
      scorePercent: result.scorePercent,
      passed: result.passed,
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_SUBMIT_ATTEMPT_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to submit assessment attempt.' });
  }
});

// Get attempt history for an assessment
router.get('/api/academy/assessments/:assessmentId/attempts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { assessmentId } = req.params;

    const attempts = await getLearnerAssessmentAttempts(tenantId, userId, assessmentId);
    res.json({ success: true, attempts });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_ATTEMPTS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve assessment attempts.' });
  }
});

// ── Phase 3: Assignment Routes ──────────────────────────────────────────────

// Create assignment (privileged)
router.post('/api/academy/assignments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { courseId, moduleId, lessonId, titleEn, titleAr, instructionsEn, instructionsAr, maxScore, passingScore, allowResubmission, dueDate } = req.body;

    if (!courseId || !titleEn || !titleAr) {
      return res.status(400).json({ error: 'courseId, titleEn, titleAr are required.' });
    }

    const assignment = await createAssignment({
      tenantId,
      courseId,
      moduleId,
      lessonId,
      titleEn,
      titleAr,
      instructionsEn,
      instructionsAr,
      maxScore,
      passingScore,
      allowResubmission,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    res.json({ success: true, assignment });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_ASSIGNMENT_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to create assignment.' });
  }
});

// List assignments for course
router.get('/api/academy/courses/:courseId/assignments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { courseId } = req.params;

    const assignments = await listAssignmentsByCourse(tenantId, courseId);
    res.json({ success: true, assignments });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_LIST_ASSIGNMENTS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve assignments.' });
  }
});

// Get assignment details and learner submission
router.get('/api/academy/assignments/:assignmentId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { assignmentId } = req.params;

    const assignment = await getAssignmentById(tenantId, assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const submission = await getLearnerAssignmentSubmission(tenantId, userId, assignmentId);

    res.json({ success: true, assignment, submission });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_ASSIGNMENT_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve assignment.' });
  }
});

// Submit assignment
router.post('/api/academy/assignments/:assignmentId/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { assignmentId } = req.params;
    const { submissionText, resourceUrls } = req.body;

    if (!submissionText) {
      return res.status(400).json({ error: 'submissionText is required.' });
    }

    const submission = await submitAssignment(tenantId, userId, assignmentId, submissionText, resourceUrls);
    logSecurityAudit('ACADEMY_ASSIGNMENT_SUBMITTED', req, { tenantId, assignmentId, submissionId: submission.id });

    res.json({ success: true, submission });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_SUBMIT_ASSIGNMENT_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to submit assignment.' });
  }
});

// Grade assignment submission (privileged)
router.post('/api/academy/submissions/:submissionId/grade', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const instructorUserId = req.user!.id;
    const { submissionId } = req.params;
    const { score, feedbackEn, feedbackAr } = req.body;

    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'score is required.' });
    }

    const submission = await gradeAssignmentSubmission(
      tenantId,
      instructorUserId,
      submissionId,
      score,
      feedbackEn,
      feedbackAr
    );

    logSecurityAudit('ACADEMY_ASSIGNMENT_GRADED', req, { tenantId, submissionId, score });
    res.json({ success: true, submission });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GRADE_SUBMISSION_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to grade submission.' });
  }
});

// ── Phase 3: Certificate & Verification Routes ─────────────────────────────

// Check certificate eligibility
router.get('/api/academy/courses/:courseId/certificate/eligibility', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { courseId } = req.params;

    const eligibility = await checkCertificateEligibility(tenantId, userId, courseId);
    res.json({ success: true, eligibility });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CHECK_ELIGIBILITY_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to check certificate eligibility.' });
  }
});

// Issue certificate
router.post('/api/academy/courses/:courseId/certificate/issue', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { courseId } = req.params;

    const certificate = await issueCertificate(tenantId, userId, courseId);
    logSecurityAudit('ACADEMY_CERTIFICATE_ISSUED', req, {
      tenantId,
      courseId,
      certificateNumber: certificate.certificateNumber,
    });

    res.json({ success: true, certificate });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ISSUE_CERT_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to issue certificate.' });
  }
});

// List user certificates
router.get('/api/academy/certificates', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;

    const certificates = await getLearnerCertificates(tenantId, userId);
    res.json({ success: true, certificates });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_CERTS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve certificates.' });
  }
});

// PUBLIC SAFE Certificate Verification (No requireAuth required!)
router.get('/api/academy/certificates/verify/:code', async (req: AuthRequest, res) => {
  try {
    const { code } = req.params;
    const verification = await verifyCertificate(code);

    res.json({ success: true, verification });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_VERIFY_CERT_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to verify certificate.' });
  }
});

// ── Phase 4: Instructor Studio APIs ────────────────────────────────────────

// Instructor Dashboard Summary
router.get('/api/academy/instructor/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;

    const stats = await getInstructorStats(tenantId, userId);
    res.json({ success: true, stats });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_INSTRUCTOR_DASHBOARD_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve instructor stats.' });
  }
});

// List Instructor Courses
router.get('/api/academy/instructor/courses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;

    const courses = await getInstructorCourses(tenantId, userId);
    res.json({ success: true, courses });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_INSTRUCTOR_COURSES_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve instructor courses.' });
  }
});

// Create Course (Authoring)
router.post('/api/academy/instructor/courses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { titleEn, titleAr, summaryEn, summaryAr, descriptionEn, descriptionAr, categoryId, learningPathId, level, language, priceSar, currency, status } = req.body;

    if (!titleEn || !titleAr) {
      return res.status(400).json({ error: 'titleEn and titleAr are required.' });
    }

    const slug = `course-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const course = await createCourse({
      tenantId,
      instructorId: userId,
      titleEn,
      titleAr,
      slug,
      summaryEn,
      summaryAr,
      descriptionEn,
      descriptionAr,
      categoryId,
      learningPathId,
      level,
      language,
      priceSar,
      currency,
      status: status || 'DRAFT',
    });

    logSecurityAudit('ACADEMY_COURSE_CREATED', req, {
      tenantId,
      courseId: course.id,
      titleEn: course.titleEn,
    });

    res.status(201).json({ success: true, course });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_COURSE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

// Update Course
router.put('/api/academy/instructor/courses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const userRole = req.user!.role || 'user';
    const { id } = req.params;

    const existing = await getCourseBySlugOrId(tenantId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Authorization: Must be course instructor or superadmin/admin
    if (existing.course.instructorId !== userId && !['superadmin', 'admin'].includes(userRole)) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, { courseId: id, requiredOwnership: userId });
      return res.status(403).json({ error: 'FORBIDDEN_COURSE_OWNERSHIP' });
    }

    const updated = await updateCourse(tenantId, id, req.body);

    if (req.body.status && req.body.status !== existing.course.status) {
      const auditType = req.body.status === 'PUBLISHED' ? 'ACADEMY_COURSE_PUBLISHED' : 'ACADEMY_COURSE_UNPUBLISHED';
      logSecurityAudit(auditType, req, { tenantId, courseId: id, newStatus: req.body.status });
    } else {
      logSecurityAudit('ACADEMY_COURSE_UPDATED', req, { tenantId, courseId: id });
    }

    res.json({ success: true, course: updated });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_UPDATE_COURSE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

// Delete Course
router.delete('/api/academy/instructor/courses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const userRole = req.user!.role || 'user';
    const { id } = req.params;

    const existing = await getCourseBySlugOrId(tenantId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (existing.course.instructorId !== userId && !['superadmin', 'admin'].includes(userRole)) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, { courseId: id, requiredOwnership: userId });
      return res.status(403).json({ error: 'FORBIDDEN_COURSE_OWNERSHIP' });
    }

    await deleteCourse(tenantId, id);
    res.json({ success: true, deleted: true });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_DELETE_COURSE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

// Module Authoring
router.post('/api/academy/instructor/courses/:id/modules', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const userRole = req.user!.role || 'user';
    const { id } = req.params;
    const { titleEn, titleAr, summaryEn, summaryAr, displayOrder } = req.body;

    const existing = await getCourseBySlugOrId(tenantId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (existing.course.instructorId !== userId && !['superadmin', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'FORBIDDEN_COURSE_OWNERSHIP' });
    }

    const moduleRow = await createCourseModule({
      tenantId,
      courseId: id,
      titleEn,
      titleAr,
      descriptionEn: summaryEn,
      descriptionAr: summaryAr,
      displayOrder,
    });

    res.status(201).json({ success: true, module: moduleRow });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_MODULE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to create module.' });
  }
});

// Lesson Authoring
router.post('/api/academy/instructor/modules/:id/lessons', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params; // moduleId
    const { courseId, titleEn, titleAr, summaryEn, summaryAr, contentEn, contentAr, lessonType, videoUrl, durationMinutes, displayOrder, isPreview } = req.body;

    if (!courseId || !titleEn || !titleAr) {
      return res.status(400).json({ error: 'courseId, titleEn, titleAr are required.' });
    }

    const lesson = await createLesson({
      tenantId,
      courseId,
      moduleId: id,
      titleEn,
      titleAr,
      summaryEn,
      summaryAr,
      contentEn,
      contentAr,
      lessonType,
      videoUrl,
      durationMinutes,
      displayOrder,
      isPreview,
    });

    res.status(201).json({ success: true, lesson });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_LESSON_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to create lesson.' });
  }
});

// Resource Authoring
router.post('/api/academy/instructor/lessons/:id/resources', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params; // lessonId
    const { titleEn, titleAr, resourceType, fileUrl, fileSize } = req.body;

    const resource = await createResource({
      tenantId,
      lessonId: id,
      titleEn,
      titleAr,
      resourceType,
      resourceUrl: fileUrl || 'https://oprox.ai/resource',
      fileSizeBytes: fileSize,
    });

    res.status(201).json({ success: true, resource });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_RESOURCE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to create resource.' });
  }
});

// Instructor Submissions list
router.get('/api/academy/instructor/submissions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;

    const submissions = await getInstructorSubmissions(tenantId, userId);
    res.json({ success: true, submissions });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_INSTRUCTOR_SUBS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve submissions.' });
  }
});


export default router;
