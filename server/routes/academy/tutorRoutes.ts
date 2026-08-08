// AI Tutor sessions and messages

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
import { generateTutorResponse } from '../../geminiTutorService';
import { getTenantId } from './academyUtils';

const router = Router();

// ── Phase 5 AI Tutor Endpoints ───────────────────────────────────────────────

// Create AI Tutor Session
router.post('/api/academy/tutor/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { courseId, lessonId, title } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required.' });
    }

    const session = await createTutorSession({
      tenantId,
      userId,
      courseId,
      lessonId,
      title: title || 'AI Tutor Conversation',
    });

    logSecurityAudit('ACADEMY_TUTOR_SESSION_CREATED', req, { tenantId, userId, courseId, sessionId: session.id });
    res.json({ success: true, session });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_TUTOR_CREATE_SESSION_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to create tutor session.' });
  }
});

// List AI Tutor Sessions for user
router.get('/api/academy/tutor/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const courseId = req.query.courseId as string;

    const sessions = await getUserTutorSessions(tenantId, userId, courseId);
    res.json({ success: true, sessions });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_TUTOR_LIST_SESSIONS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to list tutor sessions.' });
  }
});

// Get Messages in AI Tutor Session
router.get('/api/academy/tutor/sessions/:sessionId/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { sessionId } = req.params;

    const session = await getTutorSession(tenantId, userId, sessionId);
    if (!session) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, { endpoint: `/api/academy/tutor/sessions/${sessionId}/messages`, reason: 'Session not found or forbidden' });
      return res.status(404).json({ error: 'Tutor session not found or forbidden.' });
    }

    const messages = await getSessionMessages(tenantId, sessionId);
    res.json({ success: true, session, messages });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_TUTOR_GET_MESSAGES_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to fetch tutor session messages.' });
  }
});

// Send Message to AI Tutor & Get Response
router.post('/api/academy/tutor/sessions/:sessionId/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { sessionId } = req.params;
    const { content, language } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    // Verify session tenant & user ownership
    const session = await getTutorSession(tenantId, userId, sessionId);
    if (!session) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, { endpoint: `/api/academy/tutor/sessions/${sessionId}/messages`, reason: 'Session not found or forbidden' });
      return res.status(404).json({ error: 'Tutor session not found or forbidden.' });
    }

    // Save user message
    const userMsg = await addTutorMessage({
      tenantId,
      sessionId,
      role: 'user',
      content: content.trim(),
      language: language || 'en',
    });

    // Load course & lesson grounded context
    const courseData = await getCourseBySlugOrId(tenantId, session.courseId);
    let lessonContent = '';
    let lessonTitle = '';
    if (session.lessonId && courseData) {
      for (const mod of courseData.modules) {
        const found = mod.lessons.find((l) => l.id === session.lessonId);
        if (found) {
          lessonTitle = found.titleEn;
          lessonContent = found.summaryEn || found.titleEn;
          break;
        }
      }
    }

    // Load recent history for conversation continuity
    const history = await getSessionMessages(tenantId, sessionId);

    // Call Gemini AI Tutor Service
    const aiResult = await generateTutorResponse({
      courseTitle: courseData?.course.titleEn || 'OPROX Course',
      lessonTitle,
      lessonContent,
      userMessage: content.trim(),
      chatHistory: history.slice(-10).map((m) => ({ role: m.role as any, content: m.content })),
      language: language || 'en',
    });

    // Save assistant message
    const assistantMsg = await addTutorMessage({
      tenantId,
      sessionId,
      role: 'assistant',
      content: aiResult.content,
      language: language || 'en',
      groundingContext: lessonTitle || courseData?.course.titleEn,
      tokensUsed: aiResult.tokensUsed,
    });

    logSecurityAudit('ACADEMY_TUTOR_INTERACTION', req, {
      tenantId,
      userId,
      sessionId,
      courseId: session.courseId,
      tokensUsed: aiResult.tokensUsed,
    });

    res.json({
      success: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_TUTOR_SEND_MESSAGE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to process AI Tutor interaction.' });
  }
});


export default router;
