import { Router } from 'express';
import { AuthRequest, requireAuth } from './auth';
import { logStructured } from '../src/lib/logger';
import { logSecurityAudit } from './audit';
import {
  getOrCreateAcademyProfile,
  updateAcademyProfile,
  createInstructorProfile,
  getInstructorProfile,
  listInstructors,
  createCategory,
  listCategories,
  createLearningPath,
  listLearningPaths,
  createCourse,
  updateCourse,
  listCourses,
  getCourseBySlugOrId,
  createCourseModule,
  listCourseModules,
  createLesson,
  listModuleLessons,
  createResource,
  listLessonResources,
  enrollUserInCourse,
  getUserEnrollments,
  getEnrollmentByCourse,
  recordLessonProgress,
  getCourseProgress,
  toggleBookmark,
  getUserBookmarks,
  getLearnerDashboardSummary,
  createAssessment,
  addQuestionToAssessment,
  addChoiceToQuestion,
  getAssessmentById,
  listAssessmentsByCourse,
  startAssessmentAttempt,
  submitAssessmentAttempt,
  getLearnerAssessmentAttempts,
  createAssignment,
  getAssignmentById,
  listAssignmentsByCourse,
  submitAssignment,
  getLearnerAssignmentSubmission,
  gradeAssignmentSubmission,
  checkCertificateEligibility,
  issueCertificate,
  getLearnerCertificates,
  verifyCertificate,
  deleteCourse,
  getInstructorCourses,
  getInstructorStats,
  getInstructorSubmissions,
  createOrgProgram,
  getOrgPrograms,
  addCourseToOrgProgram,
  createCohort,
  getCohorts,
  addCohortMember,
  getCohortMembers,
  assignOrgLearning,
  getOrgAssignments,
  getOrgProgressSummary,
  getAcademyAdminOverview,
  getAllCoursesAdmin,
  getAllInstructorsAdmin,
  logAdminAction,
  createTutorSession,
  getTutorSession,
  getUserTutorSessions,
  addTutorMessage,
  getSessionMessages,
  upsertLearnerMastery,
  getLearnerMastery,
  generateAdaptiveRecommendations,
  getAdaptiveRecommendations,
  dismissRecommendation,
  getOrCreateLabSession,
  getLabSession,
  submitLabSession,
  listLearnerLabSessions,
} from '../src/lib/academy/academyStore';
import { generateTutorResponse } from './geminiTutorService';

const router = Router();

function getTenantId(req: AuthRequest): string {
  return (
    req.user?.orgId ||
    req.user?.id ||
    (req.headers['x-tenant-id'] as string) ||
    'default-tenant'
  );
}

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
