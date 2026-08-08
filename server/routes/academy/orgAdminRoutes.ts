// Organization learning and admin operations

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

// ── Phase 4: Organization / Enterprise Learning APIs ───────────────────────

// Org Learning Dashboard
router.get('/api/academy/org/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const orgId = req.user?.orgId || req.user?.id || 'default-org';

    const summary = await getOrgProgressSummary(tenantId, orgId);
    res.json({ success: true, summary });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ORG_DASHBOARD_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve organization dashboard.' });
  }
});

// Create Org Program
router.post('/api/academy/org/programs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const orgId = req.user?.orgId || req.user?.id || 'default-org';
    const { titleEn, titleAr, descriptionEn, descriptionAr, targetAudience } = req.body;

    if (!titleEn || !titleAr) {
      return res.status(400).json({ error: 'titleEn and titleAr are required.' });
    }

    const program = await createOrgProgram({
      tenantId,
      orgId,
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      targetAudience,
      createdById: userId,
    });

    logSecurityAudit('ACADEMY_ORG_PROGRAM_CREATED', req, { tenantId, programId: program.id });
    res.status(201).json({ success: true, program });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_ORG_PROG_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to create organization program.' });
  }
});

// List Org Programs
router.get('/api/academy/org/programs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const orgId = req.user?.orgId || req.user?.id || 'default-org';

    const programs = await getOrgPrograms(tenantId, orgId);
    res.json({ success: true, programs });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_ORG_PROGS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve organization programs.' });
  }
});

// Add Course to Org Program
router.post('/api/academy/org/programs/:id/courses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params; // programId
    const { courseId, orderIndex, isRequired } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required.' });
    }

    const item = await addCourseToOrgProgram({
      tenantId,
      programId: id,
      courseId,
      orderIndex,
      isRequired,
    });

    res.status(201).json({ success: true, item });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADD_PROG_COURSE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to add course to program.' });
  }
});

// Create Cohort
router.post('/api/academy/org/cohorts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const orgId = req.user?.orgId || req.user?.id || 'default-org';
    const { nameEn, nameAr, descriptionEn, descriptionAr } = req.body;

    if (!nameEn || !nameAr) {
      return res.status(400).json({ error: 'nameEn and nameAr are required.' });
    }

    const cohort = await createCohort({
      tenantId,
      orgId,
      nameEn,
      nameAr,
      descriptionEn,
      descriptionAr,
      createdById: userId,
    });

    res.status(201).json({ success: true, cohort });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_COHORT_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to create cohort.' });
  }
});

// List Cohorts
router.get('/api/academy/org/cohorts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const orgId = req.user?.orgId || req.user?.id || 'default-org';

    const cohorts = await getCohorts(tenantId, orgId);
    res.json({ success: true, cohorts });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_COHORTS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve cohorts.' });
  }
});

// Add Cohort Member
router.post('/api/academy/org/cohorts/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params; // cohortId
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const member = await addCohortMember(tenantId, id, userId);
    res.status(201).json({ success: true, member });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADD_COHORT_MEMBER_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to add cohort member.' });
  }
});

// Get Cohort Members
router.get('/api/academy/org/cohorts/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const members = await getCohortMembers(tenantId, id);
    res.json({ success: true, members });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_COHORT_MEMBERS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve cohort members.' });
  }
});

// Assign Learning to Org / Cohort / User
router.post('/api/academy/org/assign', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const orgId = req.user?.orgId || req.user?.id || 'default-org';
    const { targetType, targetId, assignmentType, itemCourseId, itemProgramId, dueDate } = req.body;

    const assignment = await assignOrgLearning({
      tenantId,
      orgId,
      targetType,
      targetId,
      assignmentType,
      itemCourseId,
      itemProgramId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedById: userId,
    });

    logSecurityAudit('ACADEMY_ORG_ASSIGNMENT_CREATED', req, { tenantId, assignmentId: assignment.id });
    res.status(201).json({ success: true, assignment });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ORG_ASSIGN_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to assign organization learning.' });
  }
});

// List Org Assignments
router.get('/api/academy/org/assignments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const orgId = req.user?.orgId || req.user?.id || 'default-org';

    const assignments = await getOrgAssignments(tenantId, orgId);
    res.json({ success: true, assignments });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_ORG_ASSIGNMENTS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve organization assignments.' });
  }
});

// ── Phase 4: Academy Administration APIs ────────────────────────────────────

// Admin Overview
router.get('/api/academy/admin/overview', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role || 'user';
    if (!['superadmin', 'admin'].includes(userRole)) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, { endpoint: '/api/academy/admin/overview' });
      return res.status(403).json({ error: 'FORBIDDEN_ADMIN_ACCESS' });
    }

    const tenantId = getTenantId(req);
    const overview = await getAcademyAdminOverview(tenantId);
    res.json({ success: true, overview });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADMIN_OVERVIEW_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve admin overview.' });
  }
});

// Admin All Courses Oversight
router.get('/api/academy/admin/courses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role || 'user';
    if (!['superadmin', 'admin'].includes(userRole)) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, { endpoint: '/api/academy/admin/courses' });
      return res.status(403).json({ error: 'FORBIDDEN_ADMIN_ACCESS' });
    }

    const tenantId = getTenantId(req);
    const courses = await getAllCoursesAdmin(tenantId);
    res.json({ success: true, courses });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADMIN_COURSES_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve admin courses list.' });
  }
});

// Admin Moderation Status Update
router.put('/api/academy/admin/courses/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role || 'user';
    const userId = req.user!.id;
    if (!['superadmin', 'admin'].includes(userRole)) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, { endpoint: '/api/academy/admin/courses/:id/status' });
      return res.status(403).json({ error: 'FORBIDDEN_ADMIN_ACCESS' });
    }

    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = await updateCourse(tenantId, id, { status });
    await logAdminAction({
      tenantId,
      adminUserId: userId,
      action: `COURSE_STATUS_${status}`,
      targetType: 'COURSE',
      targetId: id,
      notes,
    });

    logSecurityAudit('ACADEMY_ADMIN_ACTION', req, { tenantId, action: `COURSE_STATUS_${status}`, courseId: id });
    res.json({ success: true, course: updated });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADMIN_STATUS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to update course moderation status.' });
  }
});

// Admin Instructors Oversight
router.get('/api/academy/admin/instructors', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user!.role || 'user';
    if (!['superadmin', 'admin'].includes(userRole)) {
      logSecurityAudit('AUTHORIZATION_FAILURE', req, { endpoint: '/api/academy/admin/instructors' });
      return res.status(403).json({ error: 'FORBIDDEN_ADMIN_ACCESS' });
    }

    const tenantId = getTenantId(req);
    const instructors = await getAllInstructorsAdmin(tenantId);
    res.json({ success: true, instructors });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ADMIN_INST_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve instructors list.' });
  }
});


export default router;
