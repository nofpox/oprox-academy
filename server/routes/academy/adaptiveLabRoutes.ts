// Adaptive learning, mastery, and practical labs

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

// ── Phase 5 Adaptive Learning Endpoints ─────────────────────────────────────

// Get Adaptive Recommendations for Course
router.get('/api/academy/adaptive/recommendations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const courseId = req.query.courseId as string;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId query parameter is required.' });
    }

    const recommendations = await getAdaptiveRecommendations(tenantId, userId, courseId);
    res.json({ success: true, recommendations });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADAPTIVE_GET_RECS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve adaptive recommendations.' });
  }
});

// Dismiss Recommendation
router.post('/api/academy/adaptive/recommendations/:id/dismiss', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { id } = req.params;

    const success = await dismissRecommendation(tenantId, userId, id);
    res.json({ success });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADAPTIVE_DISMISS_REC_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to dismiss recommendation.' });
  }
});

// Get Learner Concept Mastery Profile
router.get('/api/academy/adaptive/mastery', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const courseId = req.query.courseId as string;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId query parameter is required.' });
    }

    const mastery = await getLearnerMastery(tenantId, userId, courseId);
    res.json({ success: true, mastery });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADAPTIVE_GET_MASTERY_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve learner mastery profile.' });
  }
});

// Record / Update Concept Mastery
router.post('/api/academy/adaptive/mastery', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { courseId, conceptKey, masteryScore, totalAttempts, correctAttempts } = req.body;

    if (!courseId || !conceptKey) {
      return res.status(400).json({ error: 'courseId and conceptKey are required.' });
    }

    const updated = await upsertLearnerMastery({
      tenantId,
      userId,
      courseId,
      conceptKey,
      masteryScore: Number(masteryScore) || 0,
      totalAttempts: Number(totalAttempts) || 1,
      correctAttempts: Number(correctAttempts) || 0,
    });

    logSecurityAudit('ACADEMY_MASTERY_UPDATED', req, { tenantId, userId, courseId, conceptKey, score: updated.masteryScore });
    res.json({ success: true, mastery: updated });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADAPTIVE_UPSERT_MASTERY_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to record concept mastery.' });
  }
});

// ── Phase 6 Practical Lab Routes ───────────────────────────────────────────

// Start or retrieve Practical Lab Session
router.post('/api/academy/labs/session', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { courseId, lessonId, labType, checkpoints } = req.body;

    if (!courseId || !lessonId || !labType) {
      return res.status(400).json({ error: 'courseId, lessonId, and labType are required.' });
    }

    if (labType !== 'CODING_LAB' && labType !== 'STUDIO_LAB') {
      return res.status(400).json({ error: 'Invalid labType. Must be CODING_LAB or STUDIO_LAB.' });
    }

    // Verify enrollment
    const enrollment = await getEnrollmentByCourse(tenantId, userId, courseId);
    if (!enrollment) {
      return res.status(403).json({ error: 'Must be enrolled in course to launch lab session.' });
    }

    const session = await getOrCreateLabSession({
      tenantId,
      userId,
      courseId,
      lessonId,
      labType,
      initialCheckpoints: Array.isArray(checkpoints) ? checkpoints : [],
    });

    logSecurityAudit('ACADEMY_LAB_SESSION_STARTED', req, { tenantId, userId, courseId, lessonId, labType, sessionId: session.id });
    res.json({ success: true, session });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_LAB_CREATE_SESSION_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to start lab session.' });
  }
});

// Get Practical Lab Session details (Owner + Tenant protected)
router.get('/api/academy/labs/session/:sessionId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { sessionId } = req.params;

    const session = await getLabSession(tenantId, userId, sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Lab session not found or unauthorized.' });
    }

    res.json({ success: true, session });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_LAB_GET_SESSION_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve lab session.' });
  }
});

// Submit / Complete Practical Lab
router.post('/api/academy/labs/session/:sessionId/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { sessionId } = req.params;
    const { checkpointsJson, score, feedback } = req.body;

    const submitted = await submitLabSession({
      tenantId,
      userId,
      sessionId,
      checkpointsJson: typeof checkpointsJson === 'string' ? checkpointsJson : JSON.stringify(checkpointsJson || []),
      score: Number(score) || 100,
      feedback,
    });

    if (!submitted) {
      return res.status(404).json({ error: 'Lab session not found or unauthorized.' });
    }

    // Auto-mark lesson completed if score >= 70
    if (submitted.score >= 70) {
      await recordLessonProgress({
        tenantId,
        userId,
        courseId: submitted.courseId,
        lessonId: submitted.lessonId,
        completed: true,
      });
    }

    logSecurityAudit('ACADEMY_LAB_SUBMITTED', req, { tenantId, userId, sessionId, score: submitted.score });
    res.json({ success: true, session: submitted });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_LAB_SUBMIT_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to submit lab session.' });
  }
});

// List learner's lab sessions
router.get('/api/academy/labs/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const courseId = req.query.courseId as string;

    const sessions = await listLearnerLabSessions(tenantId, userId, courseId);
    res.json({ success: true, sessions });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_LAB_LIST_SESSIONS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to list lab sessions.' });
  }
});

export default router;
