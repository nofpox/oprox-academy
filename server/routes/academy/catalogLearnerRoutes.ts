// Catalog, discovery, learner profile, enrollment, progress

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

// ── Public Catalog & Discovery API ──────────────────────────────────────────

// List categories
router.get('/api/academy/categories', async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const categories = await listCategories(tenantId);
    res.json({ success: true, categories });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_CATEGORIES_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// List learning paths
router.get('/api/academy/learning-paths', async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const learningPaths = await listLearningPaths(tenantId);
    res.json({ success: true, learningPaths });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_PATHS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve learning paths.' });
  }
});

// Public Course Catalog (Search & Filter)
router.get('/api/academy/courses', async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { q, category, level, language, learningPathId } = req.query;

    const courses = await listCourses(tenantId, {
      q: typeof q === 'string' ? q : undefined,
      category: typeof category === 'string' ? category : undefined,
      level: typeof level === 'string' ? level : undefined,
      language: typeof language === 'string' ? language : undefined,
      learningPathId: typeof learningPathId === 'string' ? learningPathId : undefined,
      status: 'PUBLISHED',
    });

    res.json({
      success: true,
      totalCount: courses.length,
      courses,
    });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_COURSES_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve course catalog.' });
  }
});

// Course Details (Public outline & syllabus)
router.get('/api/academy/courses/:idOrSlug', async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const idOrSlug = req.params.idOrSlug;

    const courseData = await getCourseBySlugOrId(tenantId, idOrSlug);
    if (!courseData) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.json({
      success: true,
      ...courseData,
    });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_COURSE_DETAIL_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve course details.' });
  }
});

// Safe Public Instructor Summary
router.get('/api/academy/instructors/:id', async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const instructor = await getInstructorProfile(tenantId, req.params.id);

    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found.' });
    }

    // Return safe public fields only
    res.json({
      success: true,
      instructor: {
        id: instructor.id,
        title: instructor.title,
        bio: instructor.bio,
        expertiseAreas: instructor.expertiseAreasJson,
        socialLinks: instructor.socialLinksJson,
        rating: instructor.rating,
        totalStudents: instructor.totalStudents,
        totalCourses: instructor.totalCourses,
        verificationStatus: instructor.verificationStatus,
      },
    });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_INSTRUCTOR_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve instructor.' });
  }
});

// ── Authenticated Learner API ──────────────────────────────────────────────

// Get learner profile
router.get('/api/academy/profile/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;

    const profile = await getOrCreateAcademyProfile(tenantId, userId);
    res.json({ success: true, profile });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_PROFILE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve learner profile.' });
  }
});

// Update learner profile
router.put('/api/academy/profile/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const { headline, bio, avatarUrl, preferLanguage } = req.body;

    const profile = await updateAcademyProfile(tenantId, userId, {
      headline,
      bio,
      avatarUrl,
      preferLanguage,
    });

    res.json({ success: true, profile });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_UPDATE_PROFILE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to update learner profile.' });
  }
});

// Enroll in a Course
router.post('/api/academy/courses/:id/enroll', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const courseId = req.params.id;

    // Verify course exists in tenant
    const courseData = await getCourseBySlugOrId(tenantId, courseId);
    if (!courseData) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const { enrollment, isNew } = await enrollUserInCourse(tenantId, userId, courseData.course.id);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: isNew ? 'ACADEMY_COURSE_ENROLL' : 'ACADEMY_COURSE_ENROLL_DUPLICATE_CHECK',
      courseId: courseData.course.id,
      userId,
    });

    res.json({
      success: true,
      isNew,
      message: isNew ? 'Successfully enrolled in course.' : 'Already enrolled in this course.',
      enrollment,
    });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_ENROLL_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to enroll in course.' });
  }
});

// List User Enrollments
router.get('/api/academy/enrollments/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;

    const enrollments = await getUserEnrollments(tenantId, userId);
    res.json({ success: true, enrollments });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_ENROLLMENTS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve enrollments.' });
  }
});

// ── Course Player & Learner Progress Endpoints (Phase 2) ───────────────────

// Get Course Player Full Package (Course details + Learner Progress)
router.get('/api/academy/player/courses/:courseId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const courseId = req.params.courseId;

    // Check enrollment ownership
    const enrollment = await getEnrollmentByCourse(tenantId, userId, courseId);
    if (!enrollment) {
      return res.status(403).json({
        error: 'ENROLLMENT_REQUIRED',
        message: 'You must be enrolled in this course to access the course player.',
      });
    }

    const courseData = await getCourseBySlugOrId(tenantId, courseId);
    if (!courseData) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const progress = await getCourseProgress(tenantId, userId, courseData.course.id);
    const bookmarks = await getUserBookmarks(tenantId, userId, courseData.course.id);

    res.json({
      success: true,
      enrollment,
      course: courseData.course,
      category: (courseData as any).category || null,
      instructor: courseData.instructor,
      modules: courseData.modules,
      progress,
      bookmarks,
    });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_PLAYER_GET_COURSE_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to load course player details.' });
  }
});

// Get Course Progress Only
router.get('/api/academy/player/courses/:courseId/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const courseId = req.params.courseId;

    const enrollment = await getEnrollmentByCourse(tenantId, userId, courseId);
    if (!enrollment) {
      return res.status(403).json({
        error: 'ENROLLMENT_REQUIRED',
        message: 'You must be enrolled in this course to view progress.',
      });
    }

    const progress = await getCourseProgress(tenantId, userId, courseId);
    res.json({ success: true, progress });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_GET_PROGRESS_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve course progress.' });
  }
});

// Record Lesson Progress (Mark complete or update playback position)
router.post('/api/academy/player/lessons/:lessonId/progress', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const lessonId = req.params.lessonId;
    const { courseId, completed, lastPositionSeconds, notes } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required.' });
    }

    const result = await recordLessonProgress({
      tenantId,
      userId,
      courseId,
      lessonId,
      completed,
      lastPositionSeconds: typeof lastPositionSeconds === 'number' ? lastPositionSeconds : undefined,
      notes: typeof notes === 'string' ? notes : undefined,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: 'ACADEMY_RECORD_LESSON_PROGRESS',
      courseId,
      lessonId,
      completed,
      userId,
    });

    res.json({
      success: true,
      lessonProgress: result.lessonProgress,
      courseProgress: result.courseProgress,
      enrollment: result.enrollment,
    });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_RECORD_PROGRESS_ERROR', { error: err?.message || err });

    if (err?.message?.startsWith('NOT_ENROLLED')) {
      return res.status(403).json({ error: 'ENROLLMENT_REQUIRED', message: err.message });
    }
    if (err?.message?.startsWith('COURSE_NOT_FOUND') || err?.message?.startsWith('LESSON_NOT_FOUND')) {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to update lesson progress.' });
  }
});

// Toggle Lesson Bookmark
router.post('/api/academy/player/lessons/:lessonId/bookmark', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;
    const lessonId = req.params.lessonId;
    const { courseId, note } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required.' });
    }

    const result = await toggleBookmark(tenantId, userId, courseId, lessonId, note);
    res.json({
      success: true,
      bookmarked: result.bookmarked,
      bookmark: result.bookmark,
    });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_TOGGLE_BOOKMARK_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
});

// Learner Dashboard Summary
router.get('/api/academy/dashboard/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user!.id;

    const summary = await getLearnerDashboardSummary(tenantId, userId);
    res.json({ success: true, summary });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_DASHBOARD_SUMMARY_ERROR', { error: err?.message || err });
    res.status(500).json({ error: 'Failed to retrieve learner dashboard summary.' });
  }
});

// ── Privileged Management Endpoints ─────────────────────────────────────────

// Create Category
router.post('/api/academy/categories', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { nameEn, nameAr, slug, descriptionEn, descriptionAr, icon, displayOrder } = req.body;

    if (!nameEn || !nameAr || !slug) {
      return res.status(400).json({ error: 'nameEn, nameAr, and slug are required.' });
    }

    const category = await createCategory({
      tenantId,
      nameEn,
      nameAr,
      slug,
      descriptionEn,
      descriptionAr,
      icon,
      displayOrder,
    });

    res.json({ success: true, category });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_CATEGORY_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to create category.' });
  }
});

// Create Learning Path
router.post('/api/academy/learning-paths', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { titleEn, titleAr, slug, descriptionEn, descriptionAr, level, estimatedHours } = req.body;

    if (!titleEn || !titleAr || !slug) {
      return res.status(400).json({ error: 'titleEn, titleAr, and slug are required.' });
    }

    const learningPath = await createLearningPath({
      tenantId,
      titleEn,
      titleAr,
      slug,
      descriptionEn,
      descriptionAr,
      level,
      estimatedHours,
    });

    res.json({ success: true, learningPath });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_PATH_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to create learning path.' });
  }
});

// Create Course
router.post('/api/academy/courses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const {
      categoryId,
      learningPathId,
      instructorId,
      titleEn,
      titleAr,
      slug,
      summaryEn,
      summaryAr,
      descriptionEn,
      descriptionAr,
      language,
      level,
      status,
      estimatedDurationMinutes,
      thumbnailUrl,
      priceSar,
      currency,
    } = req.body;

    if (!titleEn || !titleAr || !slug) {
      return res.status(400).json({ error: 'titleEn, titleAr, and slug are required.' });
    }

    const course = await createCourse({
      tenantId,
      categoryId,
      learningPathId,
      instructorId,
      titleEn,
      titleAr,
      slug,
      summaryEn,
      summaryAr,
      descriptionEn,
      descriptionAr,
      language,
      level,
      status,
      estimatedDurationMinutes,
      thumbnailUrl,
      priceSar,
      currency,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: 'ACADEMY_CREATE_COURSE',
      courseId: course.id,
      titleEn,
    });

    res.json({ success: true, course });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_COURSE_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to create course.' });
  }
});

// Update Course
router.put('/api/academy/courses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const courseId = req.params.id;

    const course = await updateCourse(tenantId, courseId, req.body);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.json({ success: true, course });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_UPDATE_COURSE_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to update course.' });
  }
});

// Create Module
router.post('/api/academy/courses/:id/modules', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const courseId = req.params.id;
    const { titleEn, titleAr, descriptionEn, descriptionAr, displayOrder } = req.body;

    if (!titleEn || !titleAr) {
      return res.status(400).json({ error: 'titleEn and titleAr are required.' });
    }

    const moduleRow = await createCourseModule({
      tenantId,
      courseId,
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      displayOrder,
    });

    res.json({ success: true, module: moduleRow });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_MODULE_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to create module.' });
  }
});

// Create Lesson
router.post('/api/academy/modules/:id/lessons', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const moduleId = req.params.id;
    const {
      courseId,
      titleEn,
      titleAr,
      summaryEn,
      summaryAr,
      lessonType,
      contentEn,
      contentAr,
      durationMinutes,
      videoUrl,
      displayOrder,
      isPreview,
    } = req.body;

    if (!courseId || !titleEn || !titleAr) {
      return res.status(400).json({ error: 'courseId, titleEn, and titleAr are required.' });
    }

    const lesson = await createLesson({
      tenantId,
      moduleId,
      courseId,
      titleEn,
      titleAr,
      summaryEn,
      summaryAr,
      lessonType,
      contentEn,
      contentAr,
      durationMinutes,
      videoUrl,
      displayOrder,
      isPreview,
    });

    res.json({ success: true, lesson });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_LESSON_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to create lesson.' });
  }
});

// Create Resource
router.post('/api/academy/lessons/:id/resources', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const lessonId = req.params.id;
    const { titleEn, titleAr, resourceType, resourceUrl, fileSizeBytes, displayOrder } = req.body;

    if (!titleEn || !titleAr || !resourceUrl) {
      return res.status(400).json({ error: 'titleEn, titleAr, and resourceUrl are required.' });
    }

    const resource = await createResource({
      tenantId,
      lessonId,
      titleEn,
      titleAr,
      resourceType,
      resourceUrl,
      fileSizeBytes,
      displayOrder,
    });

    res.json({ success: true, resource });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_RESOURCE_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to create resource.' });
  }
});

// Register Instructor Profile
router.post('/api/academy/instructors', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { userId, title, bio, expertiseAreas, socialLinks, verificationStatus } = req.body;

    const targetUserId = userId || req.user!.id;
    if (!title) {
      return res.status(400).json({ error: 'title is required.' });
    }

    const instructor = await createInstructorProfile({
      tenantId,
      userId: targetUserId,
      title,
      bio,
      expertiseAreas,
      socialLinks,
      verificationStatus,
    });

    res.json({ success: true, instructor });
  } catch (err: any) {
    logStructured('error', 'ACADEMY_CREATE_INSTRUCTOR_ERROR', { error: err?.message || err });
    res.status(400).json({ error: err?.message || 'Failed to register instructor.' });
  }
});


export default router;
