import { db } from '../../db';
import {
  academyProfilesTable,
  instructorProfilesTable,
  academyCategoriesTable,
  academyLearningPathsTable,
  academyCoursesTable,
  academyCourseModulesTable,
  academyLessonsTable,
  academyLessonResourcesTable,
  academyEnrollmentsTable,
  academyLessonProgressTable,
  academyCourseProgressTable,
  academyLearningSessionsTable,
  academyBookmarksTable,
  AcademyProfileRow,
  InstructorProfileRow,
  AcademyCategoryRow,
  AcademyLearningPathRow,
  AcademyCourseRow,
  AcademyCourseModuleRow,
  AcademyLessonRow,
  AcademyLessonResourceRow,
  AcademyEnrollmentRow,
  AcademyLessonProgressRow,
  AcademyCourseProgressRow,
  AcademyLearningSessionRow,
  AcademyBookmarkRow,
  academyAssessmentsTable,
  academyAssessmentQuestionsTable,
  academyAssessmentChoicesTable,
  academyAssessmentAttemptsTable,
  academyLearnerAnswersTable,
  academyAssignmentsTable,
  academyAssignmentSubmissionsTable,
  academyCertificatesTable,
  academyOrgProgramsTable,
  academyOrgProgramCoursesTable,
  academyCohortsTable,
  academyCohortMembersTable,
  academyOrgAssignmentsTable,
  academyInstructorCoursesTable,
  academyAdminLogsTable,
  AcademyAssessmentRow,
  AcademyAssessmentQuestionRow,
  AcademyAssessmentChoiceRow,
  AcademyAssessmentAttemptRow,
  AcademyLearnerAnswerRow,
  AcademyAssignmentRow,
  AcademyAssignmentSubmissionRow,
  AcademyCertificateRow,
  AcademyOrgProgramRow,
  AcademyOrgProgramCourseRow,
  AcademyCohortRow,
  AcademyCohortMemberRow,
  AcademyOrgAssignmentRow,
  AcademyInstructorCourseRow,
  AcademyAdminLogRow,
  academyTutorSessionsTable,
  academyTutorMessagesTable,
  academyLearnerMasteryTable,
  academyAdaptiveRecommendationsTable,
  academyLabSessionsTable,
  AcademyTutorSessionRow,
  AcademyTutorMessageRow,
  AcademyLearnerMasteryRow,
  AcademyAdaptiveRecommendationRow,
  AcademyLabSessionRow,
} from '../../db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { logStructured } from '../logger';

// In-memory fallback stores for unit testing / non-Postgres environments
const memoryProfiles: AcademyProfileRow[] = [];
const memoryInstructors: InstructorProfileRow[] = [];
const memoryCategories: AcademyCategoryRow[] = [];
const memoryPaths: AcademyLearningPathRow[] = [];
const memoryCourses: AcademyCourseRow[] = [];
const memoryModules: AcademyCourseModuleRow[] = [];
const memoryLessons: AcademyLessonRow[] = [];
const memoryResources: AcademyLessonResourceRow[] = [];
const memoryEnrollments: AcademyEnrollmentRow[] = [];
const memoryLessonProgress: AcademyLessonProgressRow[] = [];
const memoryCourseProgress: AcademyCourseProgressRow[] = [];
const memorySessions: AcademyLearningSessionRow[] = [];
const memoryBookmarks: AcademyBookmarkRow[] = [];

// Phase 3 Memory Fallbacks
const memoryAssessments: AcademyAssessmentRow[] = [];
const memoryAssessmentQuestions: AcademyAssessmentQuestionRow[] = [];
const memoryAssessmentChoices: AcademyAssessmentChoiceRow[] = [];
const memoryAssessmentAttempts: AcademyAssessmentAttemptRow[] = [];
const memoryLearnerAnswers: AcademyLearnerAnswerRow[] = [];
const memoryAssignments: AcademyAssignmentRow[] = [];
const memoryAssignmentSubmissions: AcademyAssignmentSubmissionRow[] = [];
const memoryCertificates: AcademyCertificateRow[] = [];

// Phase 4 Memory Fallbacks
const memoryOrgPrograms: AcademyOrgProgramRow[] = [];
const memoryOrgProgramCourses: AcademyOrgProgramCourseRow[] = [];
const memoryCohorts: AcademyCohortRow[] = [];
const memoryCohortMembers: AcademyCohortMemberRow[] = [];
const memoryOrgAssignments: AcademyOrgAssignmentRow[] = [];
const memoryInstructorCourses: AcademyInstructorCourseRow[] = [];
const memoryAdminLogs: AcademyAdminLogRow[] = [];

// Phase 5 Memory Fallbacks
const memoryTutorSessions: AcademyTutorSessionRow[] = [];
const memoryTutorMessages: AcademyTutorMessageRow[] = [];
const memoryLearnerMastery: AcademyLearnerMasteryRow[] = [];
const memoryAdaptiveRecommendations: AcademyAdaptiveRecommendationRow[] = [];

// Phase 6 Memory Fallbacks
const memoryLabSessions: AcademyLabSessionRow[] = [];


export function clearAcademyMemoryStore(): void {
  memoryProfiles.length = 0;
  memoryInstructors.length = 0;
  memoryCategories.length = 0;
  memoryPaths.length = 0;
  memoryCourses.length = 0;
  memoryModules.length = 0;
  memoryLessons.length = 0;
  memoryResources.length = 0;
  memoryEnrollments.length = 0;
  memoryLessonProgress.length = 0;
  memoryCourseProgress.length = 0;
  memorySessions.length = 0;
  memoryBookmarks.length = 0;
  memoryAssessments.length = 0;
  memoryAssessmentQuestions.length = 0;
  memoryAssessmentChoices.length = 0;
  memoryAssessmentAttempts.length = 0;
  memoryLearnerAnswers.length = 0;
  memoryAssignments.length = 0;
  memoryAssignmentSubmissions.length = 0;
  memoryCertificates.length = 0;
  memoryOrgPrograms.length = 0;
  memoryOrgProgramCourses.length = 0;
  memoryCohorts.length = 0;
  memoryCohortMembers.length = 0;
  memoryOrgAssignments.length = 0;
  memoryInstructorCourses.length = 0;
  memoryAdminLogs.length = 0;
  memoryTutorSessions.length = 0;
  memoryTutorMessages.length = 0;
  memoryLearnerMastery.length = 0;
  memoryAdaptiveRecommendations.length = 0;
  memoryLabSessions.length = 0;
}

// ── Profiles ───────────────────────────────────────────────────────────────

export async function getOrCreateAcademyProfile(
  tenantId: string,
  userId: string,
  data?: { headline?: string; bio?: string; avatarUrl?: string; preferLanguage?: string }
): Promise<AcademyProfileRow> {
  const existingMemory = memoryProfiles.find((p) => p.tenantId === tenantId && p.userId === userId);
  if (existingMemory && !db) return existingMemory;

  if (db) {
    try {
      const rows = await db
        .select()
        .from(academyProfilesTable)
        .where(and(eq(academyProfilesTable.tenantId, tenantId), eq(academyProfilesTable.userId, userId)))
        .limit(1);

      if (rows.length > 0) return rows[0];

      const newId = `acad_prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();
      const insertData = {
        id: newId,
        tenantId,
        userId,
        headline: data?.headline || null,
        bio: data?.bio || null,
        avatarUrl: data?.avatarUrl || null,
        preferLanguage: data?.preferLanguage || 'en',
        metadataJson: {},
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(academyProfilesTable).values(insertData as any);
      return insertData as AcademyProfileRow;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_PROFILE_FALLBACK', { error: String(err) });
    }
  }

  // Memory fallback
  let profile = memoryProfiles.find((p) => p.tenantId === tenantId && p.userId === userId);
  if (!profile) {
    const now = new Date();
    profile = {
      id: `acad_prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      userId,
      headline: data?.headline || null,
      bio: data?.bio || null,
      avatarUrl: data?.avatarUrl || null,
      preferLanguage: data?.preferLanguage || 'en',
      metadataJson: {},
      createdAt: now,
      updatedAt: now,
    };
    memoryProfiles.push(profile);
  }
  return profile;
}

export async function updateAcademyProfile(
  tenantId: string,
  userId: string,
  updates: Partial<{ headline: string; bio: string; avatarUrl: string; preferLanguage: string }>
): Promise<AcademyProfileRow> {
  const profile = await getOrCreateAcademyProfile(tenantId, userId);

  if (db) {
    try {
      const now = new Date();
      await db
        .update(academyProfilesTable)
        .set({ ...updates, updatedAt: now })
        .where(and(eq(academyProfilesTable.tenantId, tenantId), eq(academyProfilesTable.userId, userId)));

      return { ...profile, ...updates, updatedAt: now };
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_PROFILE_UPDATE_FALLBACK', { error: String(err) });
    }
  }

  const memoryIndex = memoryProfiles.findIndex((p) => p.tenantId === tenantId && p.userId === userId);
  if (memoryIndex !== -1) {
    memoryProfiles[memoryIndex] = {
      ...memoryProfiles[memoryIndex],
      ...updates,
      updatedAt: new Date(),
    };
    return memoryProfiles[memoryIndex];
  }
  return { ...profile, ...updates };
}

// ── Instructors ────────────────────────────────────────────────────────────

export async function createInstructorProfile(data: {
  tenantId: string;
  userId: string;
  title: string;
  bio?: string;
  expertiseAreas?: string[];
  socialLinks?: Record<string, string>;
  verificationStatus?: string;
}): Promise<InstructorProfileRow> {
  const id = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: InstructorProfileRow = {
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    title: data.title,
    bio: data.bio || null,
    expertiseAreasJson: data.expertiseAreas || [],
    socialLinksJson: data.socialLinks || {},
    rating: '5.0',
    totalStudents: 0,
    totalCourses: 0,
    verificationStatus: data.verificationStatus || 'VERIFIED',
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(instructorProfilesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_INSTRUCTOR_FALLBACK', { error: String(err) });
    }
  }

  memoryInstructors.push(row);
  return row;
}

export async function getInstructorProfile(tenantId: string, idOrUserId: string): Promise<InstructorProfileRow | null> {
  if (db) {
    try {
      const byId = await db
        .select()
        .from(instructorProfilesTable)
        .where(and(eq(instructorProfilesTable.tenantId, tenantId), eq(instructorProfilesTable.id, idOrUserId)))
        .limit(1);

      if (byId.length > 0) return byId[0];

      const byUser = await db
        .select()
        .from(instructorProfilesTable)
        .where(and(eq(instructorProfilesTable.tenantId, tenantId), eq(instructorProfilesTable.userId, idOrUserId)))
        .limit(1);

      if (byUser.length > 0) return byUser[0];
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_INSTRUCTOR_FALLBACK', { error: String(err) });
    }
  }

  return (
    memoryInstructors.find((i) => i.tenantId === tenantId && (i.id === idOrUserId || i.userId === idOrUserId)) || null
  );
}

export async function listInstructors(tenantId: string): Promise<InstructorProfileRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(instructorProfilesTable)
        .where(eq(instructorProfilesTable.tenantId, tenantId));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_INSTRUCTORS_FALLBACK', { error: String(err) });
    }
  }

  return memoryInstructors.filter((i) => i.tenantId === tenantId);
}

// ── Categories ─────────────────────────────────────────────────────────────

export async function createCategory(data: {
  tenantId: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  icon?: string;
  displayOrder?: number;
}): Promise<AcademyCategoryRow> {
  const id = `acad_cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyCategoryRow = {
    id,
    tenantId: data.tenantId,
    nameEn: data.nameEn,
    nameAr: data.nameAr,
    slug: data.slug,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    icon: data.icon || 'BookOpen',
    displayOrder: data.displayOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyCategoriesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CATEGORY_FALLBACK', { error: String(err) });
    }
  }

  memoryCategories.push(row);
  return row;
}

export async function listCategories(tenantId: string): Promise<AcademyCategoryRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyCategoriesTable)
        .where(eq(academyCategoriesTable.tenantId, tenantId))
        .orderBy(asc(academyCategoriesTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_CATEGORIES_FALLBACK', { error: String(err) });
    }
  }

  return memoryCategories
    .filter((c) => c.tenantId === tenantId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

// ── Learning Paths ─────────────────────────────────────────────────────────

export async function createLearningPath(data: {
  tenantId: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  level?: string;
  estimatedHours?: number;
}): Promise<AcademyLearningPathRow> {
  const id = `acad_path_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyLearningPathRow = {
    id,
    tenantId: data.tenantId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    slug: data.slug,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    level: data.level || 'ALL_LEVELS',
    estimatedHours: data.estimatedHours ?? 10,
    isPublished: true,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyLearningPathsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_PATH_FALLBACK', { error: String(err) });
    }
  }

  memoryPaths.push(row);
  return row;
}

export async function listLearningPaths(tenantId: string): Promise<AcademyLearningPathRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyLearningPathsTable)
        .where(and(eq(academyLearningPathsTable.tenantId, tenantId), eq(academyLearningPathsTable.isPublished, true)));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_PATHS_FALLBACK', { error: String(err) });
    }
  }

  return memoryPaths.filter((p) => p.tenantId === tenantId && p.isPublished);
}

// ── Courses ────────────────────────────────────────────────────────────────

export async function createCourse(data: {
  tenantId: string;
  categoryId?: string;
  learningPathId?: string;
  instructorId?: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  summaryEn?: string;
  summaryAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  language?: string;
  level?: string;
  status?: string;
  estimatedDurationMinutes?: number;
  thumbnailUrl?: string;
  priceSar?: string;
  currency?: string;
}): Promise<AcademyCourseRow> {
  const id = `acad_crs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyCourseRow = {
    id,
    tenantId: data.tenantId,
    categoryId: data.categoryId || null,
    learningPathId: data.learningPathId || null,
    instructorId: data.instructorId || null,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    slug: data.slug,
    summaryEn: data.summaryEn || null,
    summaryAr: data.summaryAr || null,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    language: data.language || 'both',
    level: data.level || 'ALL_LEVELS',
    status: data.status || 'PUBLISHED',
    estimatedDurationMinutes: data.estimatedDurationMinutes ?? 120,
    thumbnailUrl: data.thumbnailUrl || null,
    priceSar: data.priceSar || '0',
    currency: data.currency || 'SAR',
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyCoursesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_COURSE_FALLBACK', { error: String(err) });
    }
  }

  memoryCourses.push(row);
  return row;
}

export async function updateCourse(
  tenantId: string,
  courseId: string,
  data: Partial<AcademyCourseRow>
): Promise<AcademyCourseRow | null> {
  if (db) {
    try {
      const now = new Date();
      await db
        .update(academyCoursesTable)
        .set({ ...data, updatedAt: now })
        .where(and(eq(academyCoursesTable.tenantId, tenantId), eq(academyCoursesTable.id, courseId)));

      const updated = await getCourseBySlugOrId(tenantId, courseId);
      return updated?.course || null;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_UPDATE_COURSE_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryCourses.findIndex((c) => c.tenantId === tenantId && c.id === courseId);
  if (idx !== -1) {
    memoryCourses[idx] = { ...memoryCourses[idx], ...data, updatedAt: new Date() };
    return memoryCourses[idx];
  }
  return null;
}

export async function listCourses(
  tenantId: string,
  filters?: {
    q?: string;
    category?: string;
    level?: string;
    language?: string;
    learningPathId?: string;
    status?: string;
  }
): Promise<AcademyCourseRow[]> {
  const statusFilter = filters?.status || 'PUBLISHED';

  if (db) {
    try {
      const conditions: any[] = [
        eq(academyCoursesTable.tenantId, tenantId),
        eq(academyCoursesTable.status, statusFilter),
      ];

      if (filters?.category) {
        conditions.push(eq(academyCoursesTable.categoryId, filters.category));
      }
      if (filters?.level && filters.level !== 'ALL') {
        conditions.push(eq(academyCoursesTable.level, filters.level));
      }
      if (filters?.language && filters.language !== 'ALL') {
        conditions.push(eq(academyCoursesTable.language, filters.language));
      }
      if (filters?.learningPathId) {
        conditions.push(eq(academyCoursesTable.learningPathId, filters.learningPathId));
      }

      let query = db
        .select()
        .from(academyCoursesTable)
        .where(and(...conditions))
        .orderBy(desc(academyCoursesTable.createdAt));

      let results = await query;

      if (filters?.q && filters.q.trim()) {
        const term = filters.q.trim().toLowerCase();
        results = results.filter(
          (c) =>
            c.titleEn.toLowerCase().includes(term) ||
            c.titleAr.toLowerCase().includes(term) ||
            (c.summaryEn && c.summaryEn.toLowerCase().includes(term)) ||
            (c.summaryAr && c.summaryAr.toLowerCase().includes(term)) ||
            (c.descriptionEn && c.descriptionEn.toLowerCase().includes(term))
        );
      }

      return results;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_COURSES_FALLBACK', { error: String(err) });
    }
  }

  return memoryCourses.filter((c) => {
    if (c.tenantId !== tenantId) return false;
    if (c.status !== statusFilter) return false;
    if (filters?.category && c.categoryId !== filters.category) return false;
    if (filters?.level && filters.level !== 'ALL' && c.level !== filters.level) return false;
    if (filters?.language && filters.language !== 'ALL' && c.language !== filters.language && c.language !== 'both') return false;
    if (filters?.learningPathId && c.learningPathId !== filters.learningPathId) return false;

    if (filters?.q && filters.q.trim()) {
      const term = filters.q.trim().toLowerCase();
      const matchEn = c.titleEn.toLowerCase().includes(term) || (c.summaryEn && c.summaryEn.toLowerCase().includes(term));
      const matchAr = c.titleAr.toLowerCase().includes(term) || (c.summaryAr && c.summaryAr.toLowerCase().includes(term));
      if (!matchEn && !matchAr) return false;
    }
    return true;
  });
}

export async function getCourseBySlugOrId(tenantId: string, idOrSlug: string) {
  let course: AcademyCourseRow | null = null;

  if (db) {
    try {
      const byId = await db
        .select()
        .from(academyCoursesTable)
        .where(and(eq(academyCoursesTable.tenantId, tenantId), eq(academyCoursesTable.id, idOrSlug)))
        .limit(1);

      if (byId.length > 0) {
        course = byId[0];
      } else {
        const bySlug = await db
          .select()
          .from(academyCoursesTable)
          .where(and(eq(academyCoursesTable.tenantId, tenantId), eq(academyCoursesTable.slug, idOrSlug)))
          .limit(1);
        if (bySlug.length > 0) course = bySlug[0];
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_COURSE_FALLBACK', { error: String(err) });
    }
  }

  if (!course) {
    course =
      memoryCourses.find((c) => c.tenantId === tenantId && (c.id === idOrSlug || c.slug === idOrSlug)) || null;
  }

  if (!course) return null;

  // Fetch Instructor, Modules, Lessons & Resources
  const instructor = course.instructorId ? await getInstructorProfile(tenantId, course.instructorId) : null;
  const modules = await listCourseModules(tenantId, course.id);

  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await listModuleLessons(tenantId, mod.id);
      const lessonsWithResources = await Promise.all(
        lessons.map(async (lsn) => {
          const resources = await listLessonResources(tenantId, lsn.id);
          return { ...lsn, resources };
        })
      );
      return { ...mod, lessons: lessonsWithResources };
    })
  );

  return {
    course,
    instructor: instructor
      ? {
          id: instructor.id,
          title: instructor.title,
          bio: instructor.bio,
          expertiseAreas: instructor.expertiseAreasJson,
          socialLinks: instructor.socialLinksJson,
          rating: instructor.rating,
          totalStudents: instructor.totalStudents,
          totalCourses: instructor.totalCourses,
        }
      : null,
    modules: modulesWithLessons,
  };
}

// ── Modules, Lessons, Resources ───────────────────────────────────────────

export async function createCourseModule(data: {
  tenantId: string;
  courseId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  displayOrder?: number;
}): Promise<AcademyCourseModuleRow> {
  const id = `acad_mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyCourseModuleRow = {
    id,
    tenantId: data.tenantId,
    courseId: data.courseId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    displayOrder: data.displayOrder ?? 1,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyCourseModulesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_MODULE_FALLBACK', { error: String(err) });
    }
  }

  memoryModules.push(row);
  return row;
}

export async function listCourseModules(tenantId: string, courseId: string): Promise<AcademyCourseModuleRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyCourseModulesTable)
        .where(and(eq(academyCourseModulesTable.tenantId, tenantId), eq(academyCourseModulesTable.courseId, courseId)))
        .orderBy(asc(academyCourseModulesTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_MODULES_FALLBACK', { error: String(err) });
    }
  }

  return memoryModules
    .filter((m) => m.tenantId === tenantId && m.courseId === courseId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export async function createLesson(data: {
  tenantId: string;
  moduleId: string;
  courseId: string;
  titleEn: string;
  titleAr: string;
  summaryEn?: string;
  summaryAr?: string;
  lessonType?: string;
  contentEn?: string;
  contentAr?: string;
  durationMinutes?: number;
  videoUrl?: string;
  displayOrder?: number;
  isPreview?: boolean;
}): Promise<AcademyLessonRow> {
  const id = `acad_lsn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyLessonRow = {
    id,
    tenantId: data.tenantId,
    moduleId: data.moduleId,
    courseId: data.courseId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    summaryEn: data.summaryEn || null,
    summaryAr: data.summaryAr || null,
    lessonType: data.lessonType || 'TEXT',
    contentEn: data.contentEn || null,
    contentAr: data.contentAr || null,
    durationMinutes: data.durationMinutes ?? 15,
    videoUrl: data.videoUrl || null,
    displayOrder: data.displayOrder ?? 1,
    isPreview: data.isPreview ?? false,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyLessonsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LESSON_FALLBACK', { error: String(err) });
    }
  }

  memoryLessons.push(row);
  return row;
}

export async function listModuleLessons(tenantId: string, moduleId: string): Promise<AcademyLessonRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyLessonsTable)
        .where(and(eq(academyLessonsTable.tenantId, tenantId), eq(academyLessonsTable.moduleId, moduleId)))
        .orderBy(asc(academyLessonsTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_LESSONS_FALLBACK', { error: String(err) });
    }
  }

  return memoryLessons
    .filter((l) => l.tenantId === tenantId && l.moduleId === moduleId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export async function createResource(data: {
  tenantId: string;
  lessonId: string;
  titleEn: string;
  titleAr: string;
  resourceType?: string;
  resourceUrl: string;
  fileSizeBytes?: number;
  displayOrder?: number;
}): Promise<AcademyLessonResourceRow> {
  const id = `acad_res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyLessonResourceRow = {
    id,
    tenantId: data.tenantId,
    lessonId: data.lessonId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    resourceType: data.resourceType || 'LINK',
    resourceUrl: data.resourceUrl,
    fileSizeBytes: data.fileSizeBytes || null,
    displayOrder: data.displayOrder ?? 1,
    createdAt: now,
  };

  if (db) {
    try {
      await db.insert(academyLessonResourcesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_RESOURCE_FALLBACK', { error: String(err) });
    }
  }

  memoryResources.push(row);
  return row;
}

export async function listLessonResources(tenantId: string, lessonId: string): Promise<AcademyLessonResourceRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyLessonResourcesTable)
        .where(and(eq(academyLessonResourcesTable.tenantId, tenantId), eq(academyLessonResourcesTable.lessonId, lessonId)))
        .orderBy(asc(academyLessonResourcesTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_RESOURCES_FALLBACK', { error: String(err) });
    }
  }

  return memoryResources
    .filter((r) => r.tenantId === tenantId && r.lessonId === lessonId)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

// ── Enrollments ────────────────────────────────────────────────────────────

export async function enrollUserInCourse(tenantId: string, userId: string, courseId: string): Promise<{ enrollment: AcademyEnrollmentRow; isNew: boolean }> {
  // Check duplicate enrollment
  const existing = await getEnrollmentByCourse(tenantId, userId, courseId);
  if (existing) {
    return { enrollment: existing, isNew: false };
  }

  const id = `acad_enr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyEnrollmentRow = {
    id,
    tenantId,
    userId,
    courseId,
    status: 'ACTIVE',
    progressPercent: 0,
    enrolledAt: now,
    completedAt: null,
    lastAccessedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyEnrollmentsTable).values(row as any);
      return { enrollment: row, isNew: true };
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ENROLLMENT_FALLBACK', { error: String(err) });
    }
  }

  memoryEnrollments.push(row);
  return { enrollment: row, isNew: true };
}

export async function getEnrollmentByCourse(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<AcademyEnrollmentRow | null> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(academyEnrollmentsTable)
        .where(
          and(
            eq(academyEnrollmentsTable.tenantId, tenantId),
            eq(academyEnrollmentsTable.userId, userId),
            eq(academyEnrollmentsTable.courseId, courseId)
          )
        )
        .limit(1);

      if (rows.length > 0) return rows[0];
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ENROLLMENT_FALLBACK', { error: String(err) });
    }
  }

  return (
    memoryEnrollments.find((e) => e.tenantId === tenantId && e.userId === userId && e.courseId === courseId) || null
  );
}

export async function getUserEnrollments(tenantId: string, userId: string) {
  let enrollments: AcademyEnrollmentRow[] = [];

  if (db) {
    try {
      enrollments = await db
        .select()
        .from(academyEnrollmentsTable)
        .where(and(eq(academyEnrollmentsTable.tenantId, tenantId), eq(academyEnrollmentsTable.userId, userId)))
        .orderBy(desc(academyEnrollmentsTable.lastAccessedAt));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_USER_ENROLLMENTS_FALLBACK', { error: String(err) });
    }
  }

  if (enrollments.length === 0) {
    enrollments = memoryEnrollments
      .filter((e) => e.tenantId === tenantId && e.userId === userId)
      .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
  }

  // Populate course summaries
  const result = await Promise.all(
    enrollments.map(async (enr) => {
      const courseData = await getCourseBySlugOrId(tenantId, enr.courseId);
      return {
        ...enr,
        course: courseData?.course || null,
      };
    })
  );

  return result;
}

// ── OPROX Academy Phase 2 — Progress Engine & Learner Store ───────────────

export async function recordLessonProgress(data: {
  tenantId: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completed?: boolean;
  lastPositionSeconds?: number;
  notes?: string;
}): Promise<{
  lessonProgress: AcademyLessonProgressRow;
  courseProgress: AcademyCourseProgressRow;
  enrollment: AcademyEnrollmentRow;
}> {
  const { tenantId, userId, courseId, lessonId, completed, lastPositionSeconds, notes } = data;

  // 1. Verify user is enrolled
  const enrollment = await getEnrollmentByCourse(tenantId, userId, courseId);
  if (!enrollment) {
    throw new Error('NOT_ENROLLED: Learner is not enrolled in this course.');
  }

  // 2. Load course details to get all lessons
  const courseData = await getCourseBySlugOrId(tenantId, courseId);
  if (!courseData) {
    throw new Error('COURSE_NOT_FOUND: Course not found.');
  }

  const allLessons: AcademyLessonRow[] = courseData.modules.flatMap((m) => m.lessons);
  const targetLesson = allLessons.find((l) => l.id === lessonId);
  if (!targetLesson) {
    throw new Error('LESSON_NOT_FOUND: Lesson not found in this course.');
  }

  const now = new Date();
  const progressId = `acad_lprog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let updatedLessonProg: AcademyLessonProgressRow;

  if (db) {
    try {
      const existingProgRows = await db
        .select()
        .from(academyLessonProgressTable)
        .where(
          and(
            eq(academyLessonProgressTable.tenantId, tenantId),
            eq(academyLessonProgressTable.userId, userId),
            eq(academyLessonProgressTable.lessonId, lessonId)
          )
        )
        .limit(1);

      if (existingProgRows.length > 0) {
        const existing = existingProgRows[0];
        const isNowCompleted = completed !== undefined ? completed : existing.status === 'COMPLETED';
        const newStatus = isNowCompleted ? 'COMPLETED' : 'IN_PROGRESS';
        const newCompletedAt = isNowCompleted ? (existing.completedAt || now) : null;

        await db
          .update(academyLessonProgressTable)
          .set({
            status: newStatus,
            completedAt: newCompletedAt,
            lastPositionSeconds: lastPositionSeconds !== undefined ? lastPositionSeconds : existing.lastPositionSeconds,
            notes: notes !== undefined ? notes : existing.notes,
            updatedAt: now,
          })
          .where(eq(academyLessonProgressTable.id, existing.id));

        updatedLessonProg = {
          ...existing,
          status: newStatus,
          completedAt: newCompletedAt,
          lastPositionSeconds: lastPositionSeconds !== undefined ? lastPositionSeconds : existing.lastPositionSeconds,
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: now,
        };
      } else {
        const isCompleted = !!completed;
        const insertProg: AcademyLessonProgressRow = {
          id: progressId,
          tenantId,
          userId,
          enrollmentId: enrollment.id,
          courseId,
          lessonId,
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: isCompleted ? now : null,
          lastPositionSeconds: lastPositionSeconds || 0,
          notes: notes || null,
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(academyLessonProgressTable).values(insertProg as any);
        updatedLessonProg = insertProg;
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_RECORD_LESSON_PROGRESS_FALLBACK', { error: String(err) });
    }
  }

  // Fallback / memory sync
  const existingMemIdx = memoryLessonProgress.findIndex(
    (p) => p.tenantId === tenantId && p.userId === userId && p.lessonId === lessonId
  );
  if (existingMemIdx !== -1) {
    const existing = memoryLessonProgress[existingMemIdx];
    const isNowCompleted = completed !== undefined ? completed : existing.status === 'COMPLETED';
    updatedLessonProg = {
      ...existing,
      status: isNowCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isNowCompleted ? (existing.completedAt || now) : null,
      lastPositionSeconds: lastPositionSeconds !== undefined ? lastPositionSeconds : existing.lastPositionSeconds,
      notes: notes !== undefined ? notes : existing.notes,
      updatedAt: now,
    };
    memoryLessonProgress[existingMemIdx] = updatedLessonProg;
  } else if (!db || !updatedLessonProg!) {
    const isCompleted = !!completed;
    updatedLessonProg = {
      id: progressId,
      tenantId,
      userId,
      enrollmentId: enrollment.id,
      courseId,
      lessonId,
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isCompleted ? now : null,
      lastPositionSeconds: lastPositionSeconds || 0,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    };
    memoryLessonProgress.push(updatedLessonProg);
  }

  // 3. Compute overall course progress
  const allUserProgressForCourse = await getCourseLessonProgressRows(tenantId, userId, courseId);
  const completedLessonIds = new Set(
    allUserProgressForCourse.filter((p) => p.status === 'COMPLETED').map((p) => p.lessonId)
  );

  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = completedLessonIds.size;
  const progressPercent =
    totalLessonsCount > 0 ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100)) : 0;
  const isCourseCompleted = progressPercent === 100;

  // 4. Update Course Progress and Enrollment Records
  let updatedCourseProg: AcademyCourseProgressRow;
  const courseProgId = `acad_cprog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (db) {
    try {
      const existingCProgRows = await db
        .select()
        .from(academyCourseProgressTable)
        .where(
          and(
            eq(academyCourseProgressTable.tenantId, tenantId),
            eq(academyCourseProgressTable.userId, userId),
            eq(academyCourseProgressTable.courseId, courseId)
          )
        )
        .limit(1);

      if (existingCProgRows.length > 0) {
        const existingCProg = existingCProgRows[0];
        updatedCourseProg = {
          ...existingCProg,
          completedLessonsCount,
          totalLessonsCount,
          progressPercent,
          lastLessonId: lessonId,
          status: isCourseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          lastAccessedAt: now,
          completedAt: isCourseCompleted ? (existingCProg.completedAt || now) : null,
          updatedAt: now,
        };

        await db
          .update(academyCourseProgressTable)
          .set({
            completedLessonsCount,
            totalLessonsCount,
            progressPercent,
            lastLessonId: lessonId,
            status: updatedCourseProg.status,
            lastAccessedAt: now,
            completedAt: updatedCourseProg.completedAt,
            updatedAt: now,
          })
          .where(eq(academyCourseProgressTable.id, existingCProg.id));
      } else {
        updatedCourseProg = {
          id: courseProgId,
          tenantId,
          userId,
          enrollmentId: enrollment.id,
          courseId,
          completedLessonsCount,
          totalLessonsCount,
          progressPercent,
          lastLessonId: lessonId,
          status: isCourseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          startedAt: now,
          lastAccessedAt: now,
          completedAt: isCourseCompleted ? now : null,
          createdAt: now,
          updatedAt: now,
        };

        await db.insert(academyCourseProgressTable).values(updatedCourseProg as any);
      }

      // Update Enrollment Record
      await db
        .update(academyEnrollmentsTable)
        .set({
          progressPercent,
          status: isCourseCompleted ? 'COMPLETED' : 'ACTIVE',
          completedAt: isCourseCompleted ? (enrollment.completedAt || now) : null,
          lastAccessedAt: now,
          updatedAt: now,
        })
        .where(eq(academyEnrollmentsTable.id, enrollment.id));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_COURSE_PROGRESS_UPDATE_FALLBACK', { error: String(err) });
    }
  }

  // Memory fallback sync for course progress & enrollment
  const memCProgIdx = memoryCourseProgress.findIndex(
    (cp) => cp.tenantId === tenantId && cp.userId === userId && cp.courseId === courseId
  );
  if (memCProgIdx !== -1) {
    memoryCourseProgress[memCProgIdx] = {
      ...memoryCourseProgress[memCProgIdx],
      completedLessonsCount,
      totalLessonsCount,
      progressPercent,
      lastLessonId: lessonId,
      status: isCourseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      lastAccessedAt: now,
      completedAt: isCourseCompleted ? (memoryCourseProgress[memCProgIdx].completedAt || now) : null,
      updatedAt: now,
    };
    updatedCourseProg = memoryCourseProgress[memCProgIdx];
  } else if (!updatedCourseProg!) {
    updatedCourseProg = {
      id: courseProgId,
      tenantId,
      userId,
      enrollmentId: enrollment.id,
      courseId,
      completedLessonsCount,
      totalLessonsCount,
      progressPercent,
      lastLessonId: lessonId,
      status: isCourseCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      startedAt: now,
      lastAccessedAt: now,
      completedAt: isCourseCompleted ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    memoryCourseProgress.push(updatedCourseProg);
  }

  const memEnrIdx = memoryEnrollments.findIndex((e) => e.id === enrollment.id);
  const updatedEnrollment: AcademyEnrollmentRow = {
    ...enrollment,
    progressPercent,
    status: isCourseCompleted ? 'COMPLETED' : 'ACTIVE',
    completedAt: isCourseCompleted ? (enrollment.completedAt || now) : null,
    lastAccessedAt: now,
    updatedAt: now,
  };
  if (memEnrIdx !== -1) {
    memoryEnrollments[memEnrIdx] = updatedEnrollment;
  }

  // Record activity session
  await recordLearningSession({
    tenantId,
    userId,
    courseId,
    lessonId,
    durationMinutes: Math.max(1, Math.round((targetLesson.durationMinutes || 15) / 3)),
    activityType: completed ? 'LESSON_COMPLETE' : 'LESSON_VIEW',
  });

  return {
    lessonProgress: updatedLessonProg!,
    courseProgress: updatedCourseProg!,
    enrollment: updatedEnrollment,
  };
}

export async function getCourseLessonProgressRows(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<AcademyLessonProgressRow[]> {
  if (db) {
    try {
      return await db
        .select()
        .from(academyLessonProgressTable)
        .where(
          and(
            eq(academyLessonProgressTable.tenantId, tenantId),
            eq(academyLessonProgressTable.userId, userId),
            eq(academyLessonProgressTable.courseId, courseId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_LESSON_PROGRESS_FALLBACK', { error: String(err) });
    }
  }

  return memoryLessonProgress.filter(
    (p) => p.tenantId === tenantId && p.userId === userId && p.courseId === courseId
  );
}

export async function getCourseProgress(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<{
  courseProgress: AcademyCourseProgressRow | null;
  lessonProgressList: AcademyLessonProgressRow[];
  completedLessonIds: string[];
  totalLessonsCount: number;
  completedLessonsCount: number;
  progressPercent: number;
  lastLessonId: string | null;
}> {
  const courseData = await getCourseBySlugOrId(tenantId, courseId);
  const allLessons = courseData ? courseData.modules.flatMap((m) => m.lessons) : [];
  const lessonProgressList = await getCourseLessonProgressRows(tenantId, userId, courseId);

  const completedLessonIds = lessonProgressList
    .filter((p) => p.status === 'COMPLETED')
    .map((p) => p.lessonId);

  let courseProgress: AcademyCourseProgressRow | null = null;

  if (db) {
    try {
      const rows = await db
        .select()
        .from(academyCourseProgressTable)
        .where(
          and(
            eq(academyCourseProgressTable.tenantId, tenantId),
            eq(academyCourseProgressTable.userId, userId),
            eq(academyCourseProgressTable.courseId, courseId)
          )
        )
        .limit(1);

      if (rows.length > 0) courseProgress = rows[0];
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_COURSE_PROGRESS_FALLBACK', { error: String(err) });
    }
  }

  if (!courseProgress) {
    courseProgress =
      memoryCourseProgress.find(
        (cp) => cp.tenantId === tenantId && cp.userId === userId && cp.courseId === courseId
      ) || null;
  }

  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = completedLessonIds.length;
  const progressPercent =
    totalLessonsCount > 0 ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100)) : 0;
  const lastLessonId =
    courseProgress?.lastLessonId ||
    (lessonProgressList.length > 0 ? lessonProgressList[lessonProgressList.length - 1].lessonId : null) ||
    (allLessons.length > 0 ? allLessons[0].id : null);

  return {
    courseProgress,
    lessonProgressList,
    completedLessonIds,
    totalLessonsCount,
    completedLessonsCount,
    progressPercent,
    lastLessonId,
  };
}

export async function recordLearningSession(data: {
  tenantId: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  durationMinutes?: number;
  activityType?: string;
}): Promise<AcademyLearningSessionRow> {
  const id = `acad_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row: AcademyLearningSessionRow = {
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    courseId: data.courseId,
    lessonId: data.lessonId || null,
    durationMinutes: data.durationMinutes || 1,
    activityType: data.activityType || 'LESSON_VIEW',
    createdAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(academyLearningSessionsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_RECORD_SESSION_FALLBACK', { error: String(err) });
    }
  }

  memorySessions.push(row);
  return row;
}

export async function toggleBookmark(
  tenantId: string,
  userId: string,
  courseId: string,
  lessonId: string,
  note?: string
): Promise<{ bookmarked: boolean; bookmark: AcademyBookmarkRow | null }> {
  if (db) {
    try {
      const existing = await db
        .select()
        .from(academyBookmarksTable)
        .where(
          and(
            eq(academyBookmarksTable.tenantId, tenantId),
            eq(academyBookmarksTable.userId, userId),
            eq(academyBookmarksTable.lessonId, lessonId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db.delete(academyBookmarksTable).where(eq(academyBookmarksTable.id, existing[0].id));
        return { bookmarked: false, bookmark: null };
      }

      const id = `acad_bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newBm: AcademyBookmarkRow = {
        id,
        tenantId,
        userId,
        courseId,
        lessonId,
        note: note || null,
        createdAt: new Date(),
      };

      await db.insert(academyBookmarksTable).values(newBm as any);
      return { bookmarked: true, bookmark: newBm };
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_TOGGLE_BOOKMARK_FALLBACK', { error: String(err) });
    }
  }

  const existingIdx = memoryBookmarks.findIndex(
    (b) => b.tenantId === tenantId && b.userId === userId && b.lessonId === lessonId
  );

  if (existingIdx !== -1) {
    memoryBookmarks.splice(existingIdx, 1);
    return { bookmarked: false, bookmark: null };
  }

  const newBm: AcademyBookmarkRow = {
    id: `acad_bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    courseId,
    lessonId,
    note: note || null,
    createdAt: new Date(),
  };
  memoryBookmarks.push(newBm);
  return { bookmarked: true, bookmark: newBm };
}

export async function getUserBookmarks(
  tenantId: string,
  userId: string,
  courseId?: string
): Promise<AcademyBookmarkRow[]> {
  if (db) {
    try {
      const conditions = [
        eq(academyBookmarksTable.tenantId, tenantId),
        eq(academyBookmarksTable.userId, userId),
      ];
      if (courseId) conditions.push(eq(academyBookmarksTable.courseId, courseId));

      return await db
        .select()
        .from(academyBookmarksTable)
        .where(and(...conditions))
        .orderBy(desc(academyBookmarksTable.createdAt));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_BOOKMARKS_FALLBACK', { error: String(err) });
    }
  }

  return memoryBookmarks.filter(
    (b) => b.tenantId === tenantId && b.userId === userId && (!courseId || b.courseId === courseId)
  );
}

export async function getLearnerDashboardSummary(tenantId: string, userId: string) {
  const enrollments = await getUserEnrollments(tenantId, userId);

  const enrichedEnrollments = await Promise.all(
    enrollments.map(async (enr) => {
      const prog = await getCourseProgress(tenantId, userId, enr.courseId);
      return {
        ...enr,
        completedLessonsCount: prog.completedLessonsCount,
        totalLessonsCount: prog.totalLessonsCount,
        progressPercent: prog.progressPercent,
        lastLessonId: prog.lastLessonId,
        completedLessonIds: prog.completedLessonIds,
      };
    })
  );

  const inProgressCourses = enrichedEnrollments.filter((e) => e.progressPercent < 100 && e.status !== 'CANCELLED');
  const completedCourses = enrichedEnrollments.filter((e) => e.progressPercent === 100 || e.status === 'COMPLETED');

  const continueLearning = inProgressCourses.length > 0 ? inProgressCourses[0] : null;

  let recentSessions: AcademyLearningSessionRow[] = [];
  if (db) {
    try {
      recentSessions = await db
        .select()
        .from(academyLearningSessionsTable)
        .where(
          and(
            eq(academyLearningSessionsTable.tenantId, tenantId),
            eq(academyLearningSessionsTable.userId, userId)
          )
        )
        .orderBy(desc(academyLearningSessionsTable.createdAt))
        .limit(10);
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_SESSIONS_FALLBACK', { error: String(err) });
    }
  }

  if (recentSessions.length === 0) {
    recentSessions = memorySessions
      .filter((s) => s.tenantId === tenantId && s.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  const bookmarks = await getUserBookmarks(tenantId, userId);

  const totalEnrolled = enrichedEnrollments.length;
  const completedCount = completedCourses.length;
  const inProgressCount = inProgressCourses.length;
  const averageProgress =
    totalEnrolled > 0
      ? Math.round(enrichedEnrollments.reduce((sum, e) => sum + e.progressPercent, 0) / totalEnrolled)
      : 0;

  return {
    stats: {
      totalEnrolled,
      completedCount,
      inProgressCount,
      averageProgress,
    },
    continueLearning,
    inProgressCourses,
    completedCourses,
    recentActivity: recentSessions,
    bookmarks,
  };
}

// ── OPROX Academy Phase 3: Assessments, Assignments & Certificates ─────────

// 1. Assessment Creation & Retrieval
export async function createAssessment(data: {
  tenantId: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  passingScorePercent?: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
}): Promise<AcademyAssessmentRow> {
  const assessment: AcademyAssessmentRow = {
    id: `acad_asmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: data.tenantId,
    courseId: data.courseId,
    moduleId: data.moduleId || null,
    lessonId: data.lessonId || null,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    passingScorePercent: data.passingScorePercent ?? 70,
    maxAttempts: data.maxAttempts ?? 3,
    timeLimitMinutes: data.timeLimitMinutes ?? 0,
    shuffleQuestions: data.shuffleQuestions ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssessmentsTable).values(assessment).returning();
      return res || assessment;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CREATE_ASSESSMENT_FALLBACK', { error: String(err) });
    }
  }
  memoryAssessments.push(assessment);
  return assessment;
}

export async function addQuestionToAssessment(data: {
  tenantId: string;
  assessmentId: string;
  questionTextEn: string;
  questionTextAr: string;
  questionType?: string;
  points?: number;
  displayOrder?: number;
  explanationEn?: string;
  explanationAr?: string;
}): Promise<AcademyAssessmentQuestionRow> {
  const question: AcademyAssessmentQuestionRow = {
    id: `acad_quest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: data.tenantId,
    assessmentId: data.assessmentId,
    questionTextEn: data.questionTextEn,
    questionTextAr: data.questionTextAr,
    questionType: data.questionType || 'SINGLE_CHOICE',
    points: data.points ?? 1,
    displayOrder: data.displayOrder ?? 1,
    explanationEn: data.explanationEn || null,
    explanationAr: data.explanationAr || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssessmentQuestionsTable).values(question).returning();
      return res || question;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ADD_QUESTION_FALLBACK', { error: String(err) });
    }
  }
  memoryAssessmentQuestions.push(question);
  return question;
}

export async function addChoiceToQuestion(data: {
  tenantId: string;
  questionId: string;
  choiceTextEn: string;
  choiceTextAr: string;
  isCorrect?: boolean;
  displayOrder?: number;
}): Promise<AcademyAssessmentChoiceRow> {
  const choice: AcademyAssessmentChoiceRow = {
    id: `acad_choice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: data.tenantId,
    questionId: data.questionId,
    choiceTextEn: data.choiceTextEn,
    choiceTextAr: data.choiceTextAr,
    isCorrect: data.isCorrect ?? false,
    displayOrder: data.displayOrder ?? 1,
    createdAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssessmentChoicesTable).values(choice).returning();
      return res || choice;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ADD_CHOICE_FALLBACK', { error: String(err) });
    }
  }
  memoryAssessmentChoices.push(choice);
  return choice;
}

export async function getAssessmentById(
  tenantId: string,
  assessmentId: string,
  includeAnswers: boolean = false
): Promise<{
  assessment: AcademyAssessmentRow;
  questions: Array<{
    question: AcademyAssessmentQuestionRow;
    choices: Array<Partial<AcademyAssessmentChoiceRow>>;
  }>;
} | null> {
  let assessment: AcademyAssessmentRow | undefined;
  if (db) {
    try {
      const [found] = await db
        .select()
        .from(academyAssessmentsTable)
        .where(
          and(
            eq(academyAssessmentsTable.tenantId, tenantId),
            eq(academyAssessmentsTable.id, assessmentId)
          )
        );
      assessment = found;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ASSESSMENT_FALLBACK', { error: String(err) });
    }
  }
  if (!assessment) {
    assessment = memoryAssessments.find((a) => a.tenantId === tenantId && a.id === assessmentId);
  }
  if (!assessment) return null;

  let questions: AcademyAssessmentQuestionRow[] = [];
  if (db) {
    try {
      questions = await db
        .select()
        .from(academyAssessmentQuestionsTable)
        .where(
          and(
            eq(academyAssessmentQuestionsTable.tenantId, tenantId),
            eq(academyAssessmentQuestionsTable.assessmentId, assessmentId)
          )
        )
        .orderBy(asc(academyAssessmentQuestionsTable.displayOrder));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_QUESTIONS_FALLBACK', { error: String(err) });
    }
  }
  if (questions.length === 0) {
    questions = memoryAssessmentQuestions
      .filter((q) => q.tenantId === tenantId && q.assessmentId === assessmentId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  const enrichedQuestions = await Promise.all(
    questions.map(async (q) => {
      let choices: AcademyAssessmentChoiceRow[] = [];
      if (db) {
        try {
          choices = await db
            .select()
            .from(academyAssessmentChoicesTable)
            .where(
              and(
                eq(academyAssessmentChoicesTable.tenantId, tenantId),
                eq(academyAssessmentChoicesTable.questionId, q.id)
              )
            )
            .orderBy(asc(academyAssessmentChoicesTable.displayOrder));
        } catch (err) {
          logStructured('warn', 'ACADEMY_DB_GET_CHOICES_FALLBACK', { error: String(err) });
        }
      }
      if (choices.length === 0) {
        choices = memoryAssessmentChoices
          .filter((c) => c.tenantId === tenantId && c.questionId === q.id)
          .sort((a, b) => a.displayOrder - b.displayOrder);
      }

      // Safe representation when includeAnswers is false (Secrecy Check!)
      const sanitizedChoices = choices.map((c) => {
        if (includeAnswers) return c;
        const { isCorrect, ...rest } = c;
        return rest;
      });

      const sanitizedQuestion = includeAnswers
        ? q
        : { ...q, explanationEn: null, explanationAr: null };

      return {
        question: sanitizedQuestion,
        choices: sanitizedChoices,
      };
    })
  );

  return {
    assessment,
    questions: enrichedQuestions,
  };
}

export async function listAssessmentsByCourse(
  tenantId: string,
  courseId: string
): Promise<AcademyAssessmentRow[]> {
  let list: AcademyAssessmentRow[] = [];
  if (db) {
    try {
      list = await db
        .select()
        .from(academyAssessmentsTable)
        .where(
          and(
            eq(academyAssessmentsTable.tenantId, tenantId),
            eq(academyAssessmentsTable.courseId, courseId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_ASSESSMENTS_FALLBACK', { error: String(err) });
    }
  }
  if (list.length === 0) {
    list = memoryAssessments.filter((a) => a.tenantId === tenantId && a.courseId === courseId);
  }
  return list;
}

// 2. Attempts & Server-Side Scoring
export async function startAssessmentAttempt(
  tenantId: string,
  userId: string,
  assessmentId: string
): Promise<AcademyAssessmentAttemptRow> {
  const fullAsmt = await getAssessmentById(tenantId, assessmentId, true);
  if (!fullAsmt) {
    throw new Error('ASSESSMENT_NOT_FOUND');
  }
  const { assessment } = fullAsmt;

  // Check attempt history
  let attempts: AcademyAssessmentAttemptRow[] = [];
  if (db) {
    try {
      attempts = await db
        .select()
        .from(academyAssessmentAttemptsTable)
        .where(
          and(
            eq(academyAssessmentAttemptsTable.tenantId, tenantId),
            eq(academyAssessmentAttemptsTable.userId, userId),
            eq(academyAssessmentAttemptsTable.assessmentId, assessmentId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ATTEMPTS_FALLBACK', { error: String(err) });
    }
  }
  if (attempts.length === 0) {
    attempts = memoryAssessmentAttempts.filter(
      (a) => a.tenantId === tenantId && a.userId === userId && a.assessmentId === assessmentId
    );
  }

  if (assessment.maxAttempts && attempts.length >= assessment.maxAttempts) {
    throw new Error('MAX_ATTEMPTS_REACHED');
  }

  const attempt: AcademyAssessmentAttemptRow = {
    id: `acad_att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    assessmentId,
    courseId: assessment.courseId,
    attemptNumber: attempts.length + 1,
    status: 'IN_PROGRESS',
    scorePoints: 0,
    maxPoints: 0,
    scorePercent: 0,
    passed: false,
    startedAt: new Date(),
    submittedAt: null,
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssessmentAttemptsTable).values(attempt).returning();
      return res || attempt;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_START_ATTEMPT_FALLBACK', { error: String(err) });
    }
  }
  memoryAssessmentAttempts.push(attempt);
  return attempt;
}

export async function submitAssessmentAttempt(
  tenantId: string,
  userId: string,
  attemptId: string,
  answers: Array<{
    questionId: string;
    selectedChoiceIds?: string[];
    shortAnswerText?: string;
  }>
): Promise<{
  attempt: AcademyAssessmentAttemptRow;
  answers: AcademyLearnerAnswerRow[];
  passed: boolean;
  scorePercent: number;
  scorePoints: number;
  maxPoints: number;
}> {
  let attempt: AcademyAssessmentAttemptRow | undefined;
  if (db) {
    try {
      const [found] = await db
        .select()
        .from(academyAssessmentAttemptsTable)
        .where(
          and(
            eq(academyAssessmentAttemptsTable.tenantId, tenantId),
            eq(academyAssessmentAttemptsTable.id, attemptId)
          )
        );
      attempt = found;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ATTEMPT_FALLBACK', { error: String(err) });
    }
  }
  if (!attempt) {
    attempt = memoryAssessmentAttempts.find((a) => a.tenantId === tenantId && a.id === attemptId);
  }

  if (!attempt) {
    throw new Error('ATTEMPT_NOT_FOUND');
  }
  if (attempt.userId !== userId) {
    throw new Error('FORBIDDEN_ATTEMPT_OWNERSHIP'); // IDOR Protection
  }
  if (attempt.status !== 'IN_PROGRESS') {
    throw new Error('ATTEMPT_ALREADY_SUBMITTED');
  }

  const fullAsmt = await getAssessmentById(tenantId, attempt.assessmentId, true);
  if (!fullAsmt) {
    throw new Error('ASSESSMENT_NOT_FOUND');
  }

  let totalEarned = 0;
  let totalMax = 0;
  const recordedAnswers: AcademyLearnerAnswerRow[] = [];

  for (const qEntry of fullAsmt.questions) {
    const question = qEntry.question;
    const choices = qEntry.choices as AcademyAssessmentChoiceRow[];
    totalMax += question.points;

    const userAns = answers.find((a) => a.questionId === question.id);
    let isCorrect = false;
    let pointsEarned = 0;

    if (userAns) {
      const selectedChoiceIds = userAns.selectedChoiceIds || [];
      const shortText = (userAns.shortAnswerText || '').trim().toLowerCase();

      if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
        const correctChoice = choices.find((c) => c.isCorrect);
        if (correctChoice && selectedChoiceIds.includes(correctChoice.id)) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      } else if (question.questionType === 'MULTIPLE_CHOICE') {
        const correctChoiceIds = choices.filter((c) => c.isCorrect).map((c) => c.id).sort();
        const userChoiceIds = [...selectedChoiceIds].sort();

        if (
          correctChoiceIds.length === userChoiceIds.length &&
          correctChoiceIds.every((id, idx) => id === userChoiceIds[idx])
        ) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      } else if (question.questionType === 'SHORT_ANSWER') {
        const correctChoices = choices.filter((c) => c.isCorrect);
        const match = correctChoices.some(
          (c) =>
            c.choiceTextEn.trim().toLowerCase() === shortText ||
            c.choiceTextAr.trim().toLowerCase() === shortText
        );
        if (match) {
          isCorrect = true;
          pointsEarned = question.points;
        }
      }
    }

    totalEarned += pointsEarned;

    const ansRecord: AcademyLearnerAnswerRow = {
      id: `acad_ans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      attemptId,
      questionId: question.id,
      selectedChoiceIds: userAns?.selectedChoiceIds ? JSON.stringify(userAns.selectedChoiceIds) : null,
      shortAnswerText: userAns?.shortAnswerText || null,
      isCorrect,
      pointsEarned,
      createdAt: new Date(),
    };

    recordedAnswers.push(ansRecord);
  }

  const scorePercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  const passed = scorePercent >= fullAsmt.assessment.passingScorePercent;

  const updatedAttempt: AcademyAssessmentAttemptRow = {
    ...attempt,
    status: 'SUBMITTED',
    scorePoints: totalEarned,
    maxPoints: totalMax,
    scorePercent,
    passed,
    submittedAt: new Date(),
  };

  if (db) {
    try {
      await db
        .update(academyAssessmentAttemptsTable)
        .set(updatedAttempt)
        .where(eq(academyAssessmentAttemptsTable.id, attemptId));

      for (const ans of recordedAnswers) {
        await db.insert(academyLearnerAnswersTable).values(ans);
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_SUBMIT_ATTEMPT_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryAssessmentAttempts.findIndex((a) => a.id === attemptId);
  if (idx !== -1) memoryAssessmentAttempts[idx] = updatedAttempt;
  else memoryAssessmentAttempts.push(updatedAttempt);

  memoryLearnerAnswers.push(...recordedAnswers);

  // If passed and linked to a lesson, auto-record lesson completion!
  if (passed && fullAsmt.assessment.lessonId) {
    try {
      const enrollments = await getUserEnrollments(tenantId, userId);
      const enr = enrollments.find((e) => e.courseId === fullAsmt.assessment.courseId);
      if (enr) {
        await recordLessonProgress({
          tenantId,
          userId,
          courseId: fullAsmt.assessment.courseId,
          lessonId: fullAsmt.assessment.lessonId,
          completed: true,
        });
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_QUIZ_AUTO_LESSON_PROGRESS_ERROR', { error: String(err) });
    }
  }

  return {
    attempt: updatedAttempt,
    answers: recordedAnswers,
    passed,
    scorePercent,
    scorePoints: totalEarned,
    maxPoints: totalMax,
  };
}

export async function getLearnerAssessmentAttempts(
  tenantId: string,
  userId: string,
  assessmentId?: string
): Promise<AcademyAssessmentAttemptRow[]> {
  let list: AcademyAssessmentAttemptRow[] = [];
  if (db) {
    try {
      const conditions = [
        eq(academyAssessmentAttemptsTable.tenantId, tenantId),
        eq(academyAssessmentAttemptsTable.userId, userId),
      ];
      if (assessmentId) {
        conditions.push(eq(academyAssessmentAttemptsTable.assessmentId, assessmentId));
      }
      list = await db
        .select()
        .from(academyAssessmentAttemptsTable)
        .where(and(...conditions))
        .orderBy(desc(academyAssessmentAttemptsTable.attemptNumber));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_LEARNER_ATTEMPTS_FALLBACK', { error: String(err) });
    }
  }
  if (list.length === 0) {
    list = memoryAssessmentAttempts
      .filter((a) => a.tenantId === tenantId && a.userId === userId && (!assessmentId || a.assessmentId === assessmentId))
      .sort((a, b) => b.attemptNumber - a.attemptNumber);
  }
  return list;
}

// 3. Assignments & Submissions
export async function createAssignment(data: {
  tenantId: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  titleEn: string;
  titleAr: string;
  instructionsEn?: string;
  instructionsAr?: string;
  maxScore?: number;
  passingScore?: number;
  allowResubmission?: boolean;
  dueDate?: Date;
}): Promise<AcademyAssignmentRow> {
  const assignment: AcademyAssignmentRow = {
    id: `acad_asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: data.tenantId,
    courseId: data.courseId,
    moduleId: data.moduleId || null,
    lessonId: data.lessonId || null,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    instructionsEn: data.instructionsEn || null,
    instructionsAr: data.instructionsAr || null,
    maxScore: data.maxScore ?? 100,
    passingScore: data.passingScore ?? 60,
    allowResubmission: data.allowResubmission ?? true,
    dueDate: data.dueDate || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyAssignmentsTable).values(assignment).returning();
      return res || assignment;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CREATE_ASSIGNMENT_FALLBACK', { error: String(err) });
    }
  }
  memoryAssignments.push(assignment);
  return assignment;
}

export async function getAssignmentById(
  tenantId: string,
  assignmentId: string
): Promise<AcademyAssignmentRow | null> {
  let found: AcademyAssignmentRow | undefined;
  if (db) {
    try {
      const [res] = await db
        .select()
        .from(academyAssignmentsTable)
        .where(
          and(
            eq(academyAssignmentsTable.tenantId, tenantId),
            eq(academyAssignmentsTable.id, assignmentId)
          )
        );
      found = res;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ASSIGNMENT_FALLBACK', { error: String(err) });
    }
  }
  if (!found) {
    found = memoryAssignments.find((a) => a.tenantId === tenantId && a.id === assignmentId);
  }
  return found || null;
}

export async function listAssignmentsByCourse(
  tenantId: string,
  courseId: string
): Promise<AcademyAssignmentRow[]> {
  let list: AcademyAssignmentRow[] = [];
  if (db) {
    try {
      list = await db
        .select()
        .from(academyAssignmentsTable)
        .where(
          and(
            eq(academyAssignmentsTable.tenantId, tenantId),
            eq(academyAssignmentsTable.courseId, courseId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_ASSIGNMENTS_FALLBACK', { error: String(err) });
    }
  }
  if (list.length === 0) {
    list = memoryAssignments.filter((a) => a.tenantId === tenantId && a.courseId === courseId);
  }
  return list;
}

export async function submitAssignment(
  tenantId: string,
  userId: string,
  assignmentId: string,
  submissionText: string,
  resourceUrls?: string[]
): Promise<AcademyAssignmentSubmissionRow> {
  const assignment = await getAssignmentById(tenantId, assignmentId);
  if (!assignment) {
    throw new Error('ASSIGNMENT_NOT_FOUND');
  }

  // Check existing submission
  let existing: AcademyAssignmentSubmissionRow | undefined;
  if (db) {
    try {
      const [res] = await db
        .select()
        .from(academyAssignmentSubmissionsTable)
        .where(
          and(
            eq(academyAssignmentSubmissionsTable.tenantId, tenantId),
            eq(academyAssignmentSubmissionsTable.userId, userId),
            eq(academyAssignmentSubmissionsTable.assignmentId, assignmentId)
          )
        );
      existing = res;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_SUBMISSION_FALLBACK', { error: String(err) });
    }
  }
  if (!existing) {
    existing = memoryAssignmentSubmissions.find(
      (s) => s.tenantId === tenantId && s.userId === userId && s.assignmentId === assignmentId
    );
  }

  if (existing && !assignment.allowResubmission && existing.status === 'GRADED') {
    throw new Error('RESUBMISSION_NOT_ALLOWED');
  }

  const submission: AcademyAssignmentSubmissionRow = {
    id: existing?.id || `acad_sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    assignmentId,
    courseId: assignment.courseId,
    submissionText,
    resourceUrls: resourceUrls ? JSON.stringify(resourceUrls) : null,
    status: 'SUBMITTED',
    score: null,
    instructorFeedbackEn: null,
    instructorFeedbackAr: null,
    gradedByUserId: null,
    submittedAt: new Date(),
    gradedAt: null,
  };

  if (db) {
    try {
      if (existing) {
        await db
          .update(academyAssignmentSubmissionsTable)
          .set(submission)
          .where(eq(academyAssignmentSubmissionsTable.id, existing.id));
      } else {
        await db.insert(academyAssignmentSubmissionsTable).values(submission);
      }
      return submission;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_SUBMIT_ASSIGNMENT_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryAssignmentSubmissions.findIndex((s) => s.id === submission.id);
  if (idx !== -1) memoryAssignmentSubmissions[idx] = submission;
  else memoryAssignmentSubmissions.push(submission);

  return submission;
}

export async function getLearnerAssignmentSubmission(
  tenantId: string,
  userId: string,
  assignmentId: string
): Promise<AcademyAssignmentSubmissionRow | null> {
  let found: AcademyAssignmentSubmissionRow | undefined;
  if (db) {
    try {
      const [res] = await db
        .select()
        .from(academyAssignmentSubmissionsTable)
        .where(
          and(
            eq(academyAssignmentSubmissionsTable.tenantId, tenantId),
            eq(academyAssignmentSubmissionsTable.userId, userId),
            eq(academyAssignmentSubmissionsTable.assignmentId, assignmentId)
          )
        );
      found = res;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_LEARNER_SUBMISSION_FALLBACK', { error: String(err) });
    }
  }
  if (!found) {
    found = memoryAssignmentSubmissions.find(
      (s) => s.tenantId === tenantId && s.userId === userId && s.assignmentId === assignmentId
    );
  }
  return found || null;
}

export async function gradeAssignmentSubmission(
  tenantId: string,
  instructorUserId: string,
  submissionId: string,
  score: number,
  feedbackEn?: string,
  feedbackAr?: string
): Promise<AcademyAssignmentSubmissionRow> {
  let sub: AcademyAssignmentSubmissionRow | undefined;
  if (db) {
    try {
      const [res] = await db
        .select()
        .from(academyAssignmentSubmissionsTable)
        .where(
          and(
            eq(academyAssignmentSubmissionsTable.tenantId, tenantId),
            eq(academyAssignmentSubmissionsTable.id, submissionId)
          )
        );
      sub = res;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_SUBMISSION_FOR_GRADE_FALLBACK', { error: String(err) });
    }
  }
  if (!sub) {
    sub = memoryAssignmentSubmissions.find((s) => s.tenantId === tenantId && s.id === submissionId);
  }

  if (!sub) {
    throw new Error('SUBMISSION_NOT_FOUND');
  }

  const updated: AcademyAssignmentSubmissionRow = {
    ...sub,
    score,
    status: 'GRADED',
    instructorFeedbackEn: feedbackEn || null,
    instructorFeedbackAr: feedbackAr || null,
    gradedByUserId: instructorUserId,
    gradedAt: new Date(),
  };

  if (db) {
    try {
      await db
        .update(academyAssignmentSubmissionsTable)
        .set(updated)
        .where(eq(academyAssignmentSubmissionsTable.id, submissionId));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GRADE_SUBMISSION_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryAssignmentSubmissions.findIndex((s) => s.id === submissionId);
  if (idx !== -1) memoryAssignmentSubmissions[idx] = updated;
  else memoryAssignmentSubmissions.push(updated);

  return updated;
}

// 4. Certificates & Public Verification
export async function checkCertificateEligibility(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<{
  eligible: boolean;
  completedLessons: boolean;
  passedAssessments: boolean;
  passedAssignments: boolean;
  reason?: string;
}> {
  // Check lesson progress
  const progress = await getCourseProgress(tenantId, userId, courseId);
  const completedLessons = progress ? progress.progressPercent >= 100 : false;

  // Check required assessments
  const assessments = await listAssessmentsByCourse(tenantId, courseId);
  let passedAssessments = true;
  for (const asmt of assessments) {
    const attempts = await getLearnerAssessmentAttempts(tenantId, userId, asmt.id);
    const hasPassed = attempts.some((att) => att.passed);
    if (!hasPassed) {
      passedAssessments = false;
      break;
    }
  }

  // Check required assignments
  const assignments = await listAssignmentsByCourse(tenantId, courseId);
  let passedAssignments = true;
  for (const asgn of assignments) {
    const sub = await getLearnerAssignmentSubmission(tenantId, userId, asgn.id);
    if (!sub || sub.status !== 'GRADED' || (sub.score !== null && sub.score < asgn.passingScore)) {
      passedAssignments = false;
      break;
    }
  }

  const eligible = completedLessons && passedAssessments && passedAssignments;
  let reason: string | undefined;
  if (!completedLessons) reason = 'COURSE_LESSONS_INCOMPLETE';
  else if (!passedAssessments) reason = 'REQUIRED_ASSESSMENTS_NOT_PASSED';
  else if (!passedAssignments) reason = 'REQUIRED_ASSIGNMENTS_NOT_PASSED';

  return {
    eligible,
    completedLessons,
    passedAssessments,
    passedAssignments,
    reason,
  };
}

export async function issueCertificate(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<AcademyCertificateRow> {
  const eligibility = await checkCertificateEligibility(tenantId, userId, courseId);
  if (!eligibility.eligible) {
    throw new Error(`NOT_ELIGIBLE: ${eligibility.reason}`);
  }

  // Duplicate Certificate Protection
  let existingCert: AcademyCertificateRow | undefined;
  if (db) {
    try {
      const [found] = await db
        .select()
        .from(academyCertificatesTable)
        .where(
          and(
            eq(academyCertificatesTable.tenantId, tenantId),
            eq(academyCertificatesTable.userId, userId),
            eq(academyCertificatesTable.courseId, courseId)
          )
        );
      existingCert = found;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_CERTIFICATE_FALLBACK', { error: String(err) });
    }
  }
  if (!existingCert) {
    existingCert = memoryCertificates.find(
      (c) => c.tenantId === tenantId && c.userId === userId && c.courseId === courseId
    );
  }

  if (existingCert) {
    return existingCert; // Prevent duplicate issuance!
  }

  const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const certNumber = `CERT-OPX-2026-${randPart}`;
  const vCode = `vcode_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const cert: AcademyCertificateRow = {
    id: `acad_cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    courseId,
    certificateNumber: certNumber,
    verificationCode: vCode,
    completionScorePercent: 100,
    issueDate: new Date(),
    status: 'ISSUED',
    metadata: JSON.stringify({ issuer: 'OPROX Academy Certification Engine', version: 'Phase 3' }),
    createdAt: new Date(),
  };

  if (db) {
    try {
      const [res] = await db.insert(academyCertificatesTable).values(cert).returning();
      return res || cert;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ISSUE_CERT_FALLBACK', { error: String(err) });
    }
  }

  memoryCertificates.push(cert);
  return cert;
}

export async function getLearnerCertificates(
  tenantId: string,
  userId: string
): Promise<AcademyCertificateRow[]> {
  let list: AcademyCertificateRow[] = [];
  if (db) {
    try {
      list = await db
        .select()
        .from(academyCertificatesTable)
        .where(
          and(
            eq(academyCertificatesTable.tenantId, tenantId),
            eq(academyCertificatesTable.userId, userId)
          )
        );
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_CERTS_FALLBACK', { error: String(err) });
    }
  }
  if (list.length === 0) {
    list = memoryCertificates.filter((c) => c.tenantId === tenantId && c.userId === userId);
  }
  return list;
}

export async function verifyCertificate(verificationCodeOrNumber: string): Promise<{
  valid: boolean;
  certificateNumber?: string;
  verificationCode?: string;
  issueDate?: Date;
  completionScorePercent?: number;
  status?: string;
  courseTitleEn?: string;
  courseTitleAr?: string;
  learnerName?: string;
  reason?: string;
}> {
  let cert: AcademyCertificateRow | undefined;
  if (db) {
    try {
      const [byCode] = await db
        .select()
        .from(academyCertificatesTable)
        .where(eq(academyCertificatesTable.verificationCode, verificationCodeOrNumber));

      if (byCode) {
        cert = byCode;
      } else {
        const [byNum] = await db
          .select()
          .from(academyCertificatesTable)
          .where(eq(academyCertificatesTable.certificateNumber, verificationCodeOrNumber));
        cert = byNum;
      }
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_VERIFY_CERT_FALLBACK', { error: String(err) });
    }
  }

  if (!cert) {
    cert = memoryCertificates.find(
      (c) => c.verificationCode === verificationCodeOrNumber || c.certificateNumber === verificationCodeOrNumber
    );
  }

  if (!cert || cert.status !== 'ISSUED') {
    return {
      valid: false,
      reason: 'INVALID_OR_REVOKED_CERTIFICATE',
    };
  }

  // Enrich with course title and learner profile
  const course = await getCourseBySlugOrId(cert.tenantId, cert.courseId);
  const profile = await getOrCreateAcademyProfile(cert.tenantId, cert.userId);

  return {
    valid: true,
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    issueDate: cert.issueDate,
    completionScorePercent: cert.completionScorePercent,
    status: cert.status,
    courseTitleEn: course?.course.titleEn || 'OPROX Accredited Course',
    courseTitleAr: course?.course.titleAr || 'دورة معتمدة من أوبروكس',
    learnerName: profile ? `Learner (${profile.userId.substring(0, 8)})` : 'Verified Learner',
  };
}

// ── Phase 4: Instructor Studio & Course Management ─────────────────────────

export async function deleteCourse(tenantId: string, courseId: string): Promise<boolean> {
  if (db) {
    try {
      await db
        .delete(academyCoursesTable)
        .where(and(eq(academyCoursesTable.tenantId, tenantId), eq(academyCoursesTable.id, courseId)));
      return true;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_DELETE_COURSE_FALLBACK', { error: String(err) });
    }
  }

  const idx = memoryCourses.findIndex((c) => c.tenantId === tenantId && c.id === courseId);
  if (idx !== -1) {
    memoryCourses.splice(idx, 1);
    return true;
  }
  return false;
}

export async function getInstructorCourses(tenantId: string, instructorUserId: string): Promise<AcademyCourseRow[]> {
  // Check instructor profile id or course instructorId matching
  const instProfile = await getInstructorProfile(tenantId, instructorUserId);
  const instructorIdFilter = instProfile ? instProfile.id : instructorUserId;

  if (db) {
    try {
      const courses = await db
        .select()
        .from(academyCoursesTable)
        .where(
          and(
            eq(academyCoursesTable.tenantId, tenantId),
            sql`(${academyCoursesTable.instructorId} = ${instructorIdFilter} OR ${academyCoursesTable.instructorId} = ${instructorUserId})`
          )
        )
        .orderBy(desc(academyCoursesTable.createdAt));
      return courses;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_INSTRUCTOR_COURSES_FALLBACK', { error: String(err) });
    }
  }

  return memoryCourses.filter(
    (c) => c.tenantId === tenantId && (c.instructorId === instructorIdFilter || c.instructorId === instructorUserId)
  );
}

export async function getInstructorStats(tenantId: string, instructorUserId: string) {
  const courses = await getInstructorCourses(tenantId, instructorUserId);
  const courseIds = courses.map((c) => c.id);

  let totalEnrollments = 0;
  let pendingSubmissionsCount = 0;

  if (courseIds.length > 0) {
    if (db) {
      try {
        const enrolls = await db
          .select()
          .from(academyEnrollmentsTable)
          .where(and(eq(academyEnrollmentsTable.tenantId, tenantId)));
        totalEnrollments = enrolls.filter((e) => courseIds.includes(e.courseId)).length;

        const subs = await db
          .select()
          .from(academyAssignmentSubmissionsTable)
          .where(and(eq(academyAssignmentSubmissionsTable.tenantId, tenantId), eq(academyAssignmentSubmissionsTable.status, 'SUBMITTED')));
        pendingSubmissionsCount = subs.filter((s) => courseIds.includes(s.courseId)).length;
      } catch (err) {
        logStructured('warn', 'ACADEMY_DB_INSTRUCTOR_STATS_FALLBACK', { error: String(err) });
      }
    } else {
      totalEnrollments = memoryEnrollments.filter((e) => e.tenantId === tenantId && courseIds.includes(e.courseId)).length;
      pendingSubmissionsCount = memoryAssignmentSubmissions.filter(
        (s) => s.tenantId === tenantId && courseIds.includes(s.courseId) && s.status === 'SUBMITTED'
      ).length;
    }
  }

  return {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === 'PUBLISHED').length,
    draftCourses: courses.filter((c) => c.status === 'DRAFT').length,
    totalEnrollments,
    pendingSubmissionsCount,
  };
}

export async function getInstructorSubmissions(tenantId: string, instructorUserId: string) {
  const courses = await getInstructorCourses(tenantId, instructorUserId);
  const courseIds = courses.map((c) => c.id);

  if (courseIds.length === 0) return [];

  if (db) {
    try {
      const subs = await db
        .select()
        .from(academyAssignmentSubmissionsTable)
        .where(and(eq(academyAssignmentSubmissionsTable.tenantId, tenantId)))
        .orderBy(desc(academyAssignmentSubmissionsTable.submittedAt));
      return subs.filter((s) => courseIds.includes(s.courseId));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_INSTRUCTOR_SUBS_FALLBACK', { error: String(err) });
    }
  }

  return memoryAssignmentSubmissions
    .filter((s) => s.tenantId === tenantId && courseIds.includes(s.courseId))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

// ── Phase 4: Organization Learning Programs & Cohorts ───────────────────────

export async function createOrgProgram(data: {
  tenantId: string;
  orgId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  targetAudience?: string;
  createdById: string;
}): Promise<AcademyOrgProgramRow> {
  const id = `acad_prog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyOrgProgramRow = {
    id,
    tenantId: data.tenantId,
    orgId: data.orgId,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    targetAudience: data.targetAudience || null,
    isPublished: true,
    createdById: data.createdById,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyOrgProgramsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CREATE_ORG_PROG_FALLBACK', { error: String(err) });
    }
  }

  memoryOrgPrograms.push(row);
  return row;
}

export async function getOrgPrograms(tenantId: string, orgId: string): Promise<AcademyOrgProgramRow[]> {
  if (db) {
    try {
      const result = await db
        .select()
        .from(academyOrgProgramsTable)
        .where(and(eq(academyOrgProgramsTable.tenantId, tenantId), eq(academyOrgProgramsTable.orgId, orgId)))
        .orderBy(desc(academyOrgProgramsTable.createdAt));
      return result;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ORG_PROGS_FALLBACK', { error: String(err) });
    }
  }

  return memoryOrgPrograms.filter((p) => p.tenantId === tenantId && p.orgId === orgId);
}

export async function addCourseToOrgProgram(data: {
  tenantId: string;
  programId: string;
  courseId: string;
  orderIndex?: number;
  isRequired?: boolean;
}): Promise<AcademyOrgProgramCourseRow> {
  const id = `acad_prog_crs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row: AcademyOrgProgramCourseRow = {
    id,
    tenantId: data.tenantId,
    programId: data.programId,
    courseId: data.courseId,
    orderIndex: data.orderIndex ?? 0,
    isRequired: data.isRequired ?? true,
    createdAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(academyOrgProgramCoursesTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ADD_COURSE_ORG_PROG_FALLBACK', { error: String(err) });
    }
  }

  memoryOrgProgramCourses.push(row);
  return row;
}

export async function createCohort(data: {
  tenantId: string;
  orgId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  createdById: string;
}): Promise<AcademyCohortRow> {
  const id = `acad_chrt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyCohortRow = {
    id,
    tenantId: data.tenantId,
    orgId: data.orgId,
    nameEn: data.nameEn,
    nameAr: data.nameAr,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    createdById: data.createdById,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyCohortsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CREATE_COHORT_FALLBACK', { error: String(err) });
    }
  }

  memoryCohorts.push(row);
  return row;
}

export async function getCohorts(tenantId: string, orgId: string): Promise<AcademyCohortRow[]> {
  if (db) {
    try {
      const result = await db
        .select()
        .from(academyCohortsTable)
        .where(and(eq(academyCohortsTable.tenantId, tenantId), eq(academyCohortsTable.orgId, orgId)))
        .orderBy(desc(academyCohortsTable.createdAt));
      return result;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_COHORTS_FALLBACK', { error: String(err) });
    }
  }

  return memoryCohorts.filter((c) => c.tenantId === tenantId && c.orgId === orgId);
}

export async function addCohortMember(tenantId: string, cohortId: string, userId: string): Promise<AcademyCohortMemberRow> {
  const id = `acad_chrt_mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row: AcademyCohortMemberRow = {
    id,
    tenantId,
    cohortId,
    userId,
    joinedAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(academyCohortMembersTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ADD_COHORT_MEMBER_FALLBACK', { error: String(err) });
    }
  }

  const existing = memoryCohortMembers.find((m) => m.tenantId === tenantId && m.cohortId === cohortId && m.userId === userId);
  if (existing) return existing;

  memoryCohortMembers.push(row);
  return row;
}

export async function getCohortMembers(tenantId: string, cohortId: string): Promise<AcademyCohortMemberRow[]> {
  if (db) {
    try {
      const result = await db
        .select()
        .from(academyCohortMembersTable)
        .where(and(eq(academyCohortMembersTable.tenantId, tenantId), eq(academyCohortMembersTable.cohortId, cohortId)));
      return result;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_COHORT_MEMBERS_FALLBACK', { error: String(err) });
    }
  }

  return memoryCohortMembers.filter((m) => m.tenantId === tenantId && m.cohortId === cohortId);
}

export async function assignOrgLearning(data: {
  tenantId: string;
  orgId: string;
  targetType?: 'ORGANIZATION' | 'COHORT' | 'USER';
  targetId?: string;
  assignmentType?: 'COURSE' | 'PROGRAM';
  itemCourseId?: string;
  itemProgramId?: string;
  dueDate?: Date;
  assignedById: string;
}): Promise<AcademyOrgAssignmentRow> {
  const id = `acad_org_asgn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row: AcademyOrgAssignmentRow = {
    id,
    tenantId: data.tenantId,
    orgId: data.orgId,
    targetType: data.targetType || 'ORGANIZATION',
    targetId: data.targetId || null,
    assignmentType: data.assignmentType || 'COURSE',
    itemCourseId: data.itemCourseId || null,
    itemProgramId: data.itemProgramId || null,
    dueDate: data.dueDate || null,
    assignedById: data.assignedById,
    createdAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(academyOrgAssignmentsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ASSIGN_ORG_LEARNING_FALLBACK', { error: String(err) });
    }
  }

  memoryOrgAssignments.push(row);
  return row;
}

export async function getOrgAssignments(tenantId: string, orgId: string): Promise<AcademyOrgAssignmentRow[]> {
  if (db) {
    try {
      const result = await db
        .select()
        .from(academyOrgAssignmentsTable)
        .where(and(eq(academyOrgAssignmentsTable.tenantId, tenantId), eq(academyOrgAssignmentsTable.orgId, orgId)))
        .orderBy(desc(academyOrgAssignmentsTable.createdAt));
      return result;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ORG_ASSIGNMENTS_FALLBACK', { error: String(err) });
    }
  }

  return memoryOrgAssignments.filter((a) => a.tenantId === tenantId && a.orgId === orgId);
}

export async function getOrgProgressSummary(tenantId: string, orgId: string) {
  const programs = await getOrgPrograms(tenantId, orgId);
  const cohorts = await getCohorts(tenantId, orgId);
  const assignments = await getOrgAssignments(tenantId, orgId);

  let totalEnrollments = 0;
  let totalCompletions = 0;
  let totalCertificates = 0;

  if (db) {
    try {
      const enrolls = await db
        .select()
        .from(academyEnrollmentsTable)
        .where(eq(academyEnrollmentsTable.tenantId, tenantId));
      totalEnrollments = enrolls.length;

      const certs = await db
        .select()
        .from(academyCertificatesTable)
        .where(eq(academyCertificatesTable.tenantId, tenantId));
      totalCertificates = certs.length;

      const prog = await db
        .select()
        .from(academyCourseProgressTable)
        .where(and(eq(academyCourseProgressTable.tenantId, tenantId), eq(academyCourseProgressTable.status, 'COMPLETED')));
      totalCompletions = prog.length;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ORG_SUMMARY_FALLBACK', { error: String(err) });
    }
  } else {
    totalEnrollments = memoryEnrollments.filter((e) => e.tenantId === tenantId).length;
    totalCertificates = memoryCertificates.filter((c) => c.tenantId === tenantId).length;
    totalCompletions = memoryCourseProgress.filter((p) => p.tenantId === tenantId && p.status === 'COMPLETED').length;
  }

  return {
    orgId,
    totalPrograms: programs.length,
    totalCohorts: cohorts.length,
    totalAssignments: assignments.length,
    totalEnrollments,
    totalCompletions,
    totalCertificates,
  };
}

// ── Phase 4: Academy Administration & Oversight ────────────────────────────

export async function getAcademyAdminOverview(tenantId: string) {
  let allCourses: AcademyCourseRow[] = [];
  let allInstructors: InstructorProfileRow[] = [];
  let totalEnrollments = 0;
  let totalCertificates = 0;
  let totalSubmissions = 0;

  if (db) {
    try {
      allCourses = await db
        .select()
        .from(academyCoursesTable)
        .where(eq(academyCoursesTable.tenantId, tenantId));

      allInstructors = await db
        .select()
        .from(instructorProfilesTable)
        .where(eq(instructorProfilesTable.tenantId, tenantId));

      const enrolls = await db
        .select()
        .from(academyEnrollmentsTable)
        .where(eq(academyEnrollmentsTable.tenantId, tenantId));
      totalEnrollments = enrolls.length;

      const certs = await db
        .select()
        .from(academyCertificatesTable)
        .where(eq(academyCertificatesTable.tenantId, tenantId));
      totalCertificates = certs.length;

      const subs = await db
        .select()
        .from(academyAssignmentSubmissionsTable)
        .where(eq(academyAssignmentSubmissionsTable.tenantId, tenantId));
      totalSubmissions = subs.length;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ADMIN_OVERVIEW_FALLBACK', { error: String(err) });
    }
  } else {
    allCourses = memoryCourses.filter((c) => c.tenantId === tenantId);
    allInstructors = memoryInstructors.filter((i) => i.tenantId === tenantId);
    totalEnrollments = memoryEnrollments.filter((e) => e.tenantId === tenantId).length;
    totalCertificates = memoryCertificates.filter((c) => c.tenantId === tenantId).length;
    totalSubmissions = memoryAssignmentSubmissions.filter((s) => s.tenantId === tenantId).length;
  }

  return {
    totalCourses: allCourses.length,
    publishedCourses: allCourses.filter((c) => c.status === 'PUBLISHED').length,
    draftCourses: allCourses.filter((c) => c.status === 'DRAFT').length,
    totalInstructors: allInstructors.length,
    totalEnrollments,
    totalCertificates,
    totalSubmissions,
  };
}

export async function getAllCoursesAdmin(tenantId: string): Promise<AcademyCourseRow[]> {
  if (db) {
    try {
      const courses = await db
        .select()
        .from(academyCoursesTable)
        .where(eq(academyCoursesTable.tenantId, tenantId))
        .orderBy(desc(academyCoursesTable.createdAt));
      return courses;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ALL_COURSES_ADMIN_FALLBACK', { error: String(err) });
    }
  }

  return memoryCourses.filter((c) => c.tenantId === tenantId);
}

export async function getAllInstructorsAdmin(tenantId: string): Promise<InstructorProfileRow[]> {
  if (db) {
    try {
      const insts = await db
        .select()
        .from(instructorProfilesTable)
        .where(eq(instructorProfilesTable.tenantId, tenantId))
        .orderBy(desc(instructorProfilesTable.createdAt));
      return insts;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_ALL_INST_ADMIN_FALLBACK', { error: String(err) });
    }
  }

  return memoryInstructors.filter((i) => i.tenantId === tenantId);
}

export async function logAdminAction(data: {
  tenantId: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  notes?: string;
}): Promise<AcademyAdminLogRow> {
  const id = `acad_adm_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row: AcademyAdminLogRow = {
    id,
    tenantId: data.tenantId,
    adminUserId: data.adminUserId,
    action: data.action,
    targetType: data.targetType,
    targetId: data.targetId,
    notes: data.notes || null,
    createdAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(academyAdminLogsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LOG_ADMIN_ACTION_FALLBACK', { error: String(err) });
    }
  }

  memoryAdminLogs.push(row);
  return row;
}

// ── Phase 5 AI Tutor & Adaptive Learning ────────────────────────────────────

export async function createTutorSession(data: {
  tenantId: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  title: string;
}): Promise<AcademyTutorSessionRow> {
  const id = `acad_tut_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const row: AcademyTutorSessionRow = {
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    courseId: data.courseId,
    lessonId: data.lessonId || null,
    title: data.title,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyTutorSessionsTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CREATE_TUTOR_SESSION_FALLBACK', { error: String(err) });
    }
  }

  memoryTutorSessions.push(row);
  return row;
}

export async function getTutorSession(tenantId: string, userId: string, sessionId: string): Promise<AcademyTutorSessionRow | null> {
  if (db) {
    try {
      const [sess] = await db
        .select()
        .from(academyTutorSessionsTable)
        .where(and(eq(academyTutorSessionsTable.tenantId, tenantId), eq(academyTutorSessionsTable.userId, userId), eq(academyTutorSessionsTable.id, sessionId)));
      return sess || null;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_TUTOR_SESSION_FALLBACK', { error: String(err) });
    }
  }

  return memoryTutorSessions.find((s) => s.tenantId === tenantId && s.userId === userId && s.id === sessionId) || null;
}

export async function getUserTutorSessions(tenantId: string, userId: string, courseId?: string): Promise<AcademyTutorSessionRow[]> {
  if (db) {
    try {
      let query = db
        .select()
        .from(academyTutorSessionsTable)
        .where(and(eq(academyTutorSessionsTable.tenantId, tenantId), eq(academyTutorSessionsTable.userId, userId)));

      const sessList = await query.orderBy(desc(academyTutorSessionsTable.updatedAt));
      if (courseId) {
        return sessList.filter((s) => s.courseId === courseId);
      }
      return sessList;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_USER_TUTOR_SESSIONS_FALLBACK', { error: String(err) });
    }
  }

  let list = memoryTutorSessions.filter((s) => s.tenantId === tenantId && s.userId === userId);
  if (courseId) {
    list = list.filter((s) => s.courseId === courseId);
  }
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function addTutorMessage(data: {
  tenantId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: string;
  groundingContext?: string;
  tokensUsed?: number;
}): Promise<AcademyTutorMessageRow> {
  const id = `acad_tut_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row: AcademyTutorMessageRow = {
    id,
    tenantId: data.tenantId,
    sessionId: data.sessionId,
    role: data.role,
    content: data.content,
    language: data.language || 'en',
    groundingContext: data.groundingContext || null,
    tokensUsed: data.tokensUsed || 0,
    createdAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(academyTutorMessagesTable).values(row as any);
      await db
        .update(academyTutorSessionsTable)
        .set({ updatedAt: new Date() })
        .where(and(eq(academyTutorSessionsTable.tenantId, data.tenantId), eq(academyTutorSessionsTable.id, data.sessionId)));
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_ADD_TUTOR_MSG_FALLBACK', { error: String(err) });
    }
  }

  memoryTutorMessages.push(row);
  const sess = memoryTutorSessions.find((s) => s.tenantId === data.tenantId && s.id === data.sessionId);
  if (sess) sess.updatedAt = new Date();
  return row;
}

export async function getSessionMessages(tenantId: string, sessionId: string): Promise<AcademyTutorMessageRow[]> {
  if (db) {
    try {
      const msgs = await db
        .select()
        .from(academyTutorMessagesTable)
        .where(and(eq(academyTutorMessagesTable.tenantId, tenantId), eq(academyTutorMessagesTable.sessionId, sessionId)))
        .orderBy(asc(academyTutorMessagesTable.createdAt));
      return msgs;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_SESSION_MSGS_FALLBACK', { error: String(err) });
    }
  }

  return memoryTutorMessages
    .filter((m) => m.tenantId === tenantId && m.sessionId === sessionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function upsertLearnerMastery(data: {
  tenantId: string;
  userId: string;
  courseId: string;
  conceptKey: string;
  masteryScore: number;
  totalAttempts: number;
  correctAttempts: number;
}): Promise<AcademyLearnerMasteryRow> {
  const now = new Date();
  const existing = await getLearnerMastery(data.tenantId, data.userId, data.courseId);
  const matched = existing.find((m) => m.conceptKey === data.conceptKey);

  if (matched) {
    const updated: AcademyLearnerMasteryRow = {
      ...matched,
      masteryScore: Math.min(100, Math.max(0, data.masteryScore)),
      totalAttempts: matched.totalAttempts + data.totalAttempts,
      correctAttempts: matched.correctAttempts + data.correctAttempts,
      lastEvaluatedAt: now,
      updatedAt: now,
    };

    if (db) {
      try {
        await db
          .update(academyLearnerMasteryTable)
          .set({
            masteryScore: updated.masteryScore,
            totalAttempts: updated.totalAttempts,
            correctAttempts: updated.correctAttempts,
            lastEvaluatedAt: now,
            updatedAt: now,
          })
          .where(and(eq(academyLearnerMasteryTable.tenantId, data.tenantId), eq(academyLearnerMasteryTable.id, matched.id)));
        return updated;
      } catch (err) {
        logStructured('warn', 'ACADEMY_DB_UPSERT_MASTERY_UPDATE_FALLBACK', { error: String(err) });
      }
    }

    const idx = memoryLearnerMastery.findIndex((m) => m.id === matched.id);
    if (idx >= 0) memoryLearnerMastery[idx] = updated;
    return updated;
  }

  const id = `acad_mstr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const row: AcademyLearnerMasteryRow = {
    id,
    tenantId: data.tenantId,
    userId: data.userId,
    courseId: data.courseId,
    conceptKey: data.conceptKey,
    masteryScore: Math.min(100, Math.max(0, data.masteryScore)),
    totalAttempts: data.totalAttempts,
    correctAttempts: data.correctAttempts,
    lastEvaluatedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(academyLearnerMasteryTable).values(row as any);
      return row;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_UPSERT_MASTERY_INSERT_FALLBACK', { error: String(err) });
    }
  }

  memoryLearnerMastery.push(row);
  return row;
}

export async function getLearnerMastery(tenantId: string, userId: string, courseId: string): Promise<AcademyLearnerMasteryRow[]> {
  if (db) {
    try {
      const records = await db
        .select()
        .from(academyLearnerMasteryTable)
        .where(
          and(
            eq(academyLearnerMasteryTable.tenantId, tenantId),
            eq(academyLearnerMasteryTable.userId, userId),
            eq(academyLearnerMasteryTable.courseId, courseId)
          )
        );
      return records;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_LEARNER_MASTERY_FALLBACK', { error: String(err) });
    }
  }

  return memoryLearnerMastery.filter(
    (m) => m.tenantId === tenantId && m.userId === userId && m.courseId === courseId
  );
}

export async function generateAdaptiveRecommendations(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<AcademyAdaptiveRecommendationRow[]> {
  // Fetch real learner data
  const attempts = await getLearnerAssessmentAttempts(tenantId, userId);
  const courseProgressList = await getCourseProgress(tenantId, userId, courseId);
  const modules = await listCourseModules(tenantId, courseId);
  const lessonsLists = await Promise.all(modules.map((m) => listModuleLessons(tenantId, m.id)));
  const lessons = lessonsLists.flat();
  const mastery = await getLearnerMastery(tenantId, userId, courseId);

  const courseAttempts = attempts.filter((a) => a.courseId === courseId);
  const recsToInsert: Array<Omit<AcademyAdaptiveRecommendationRow, 'id' | 'createdAt'>> = [];

  // Check assessment performance signals
  const failedAttempts = courseAttempts.filter((a) => a.scorePercent < 70);
  if (failedAttempts.length > 0) {
    recsToInsert.push({
      tenantId,
      userId,
      courseId,
      recommendationType: 'WEAK_CONCEPT',
      titleEn: 'Review Low-Scoring Assessment Topics',
      titleAr: 'مراجعة المواضيع ذات الدرجات المنخفضة في التقييم',
      descriptionEn: `Your score was ${failedAttempts[0].scorePercent}%. Revisit key lesson materials to strengthen your understanding before retaking.`,
      descriptionAr: `كانت درجتك ${failedAttempts[0].scorePercent}%. يرجى مراجعة مواد الدروس لتعزيز فهمك قبل إعادة المحاولة.`,
      lessonId: null,
      targetConcept: 'Assessment Revision',
      priority: 1,
      isDismissed: false,
    });
  }

  // Check uncompleted lessons
  if (lessons.length > 0) {
    const courseProgress = courseProgressList[0];
    const completedPct = courseProgress?.progressPercent || 0;

    if (completedPct < 100) {
      recsToInsert.push({
        tenantId,
        userId,
        courseId,
        recommendationType: 'NEXT_LESSON',
        titleEn: 'Continue Your Learning Pathway',
        titleAr: 'مواصلة مسارك التعليمي',
        descriptionEn: `You have completed ${completedPct}% of the course. Keep your streak going!`,
        descriptionAr: `لقد أكملت ${completedPct}% من الدوره. حافظ على استمرارية تقدمك!`,
        lessonId: lessons[0]?.id || null,
        targetConcept: 'Course Continuity',
        priority: 2,
        isDismissed: false,
      });
    } else {
      recsToInsert.push({
        tenantId,
        userId,
        courseId,
        recommendationType: 'NEXT_COURSE',
        titleEn: 'Course Completed — Explore Next Path',
        titleAr: 'تم إكمال الدورة — استكشف المسار التالي',
        descriptionEn: 'Congratulations on completing this course! Check out advanced paths to continue your skill growth.',
        descriptionAr: 'تهانينا لإكمال هذه الدورة! استكشف المسارات المتقدمة لمواصلة تطوير مهاراتك.',
        lessonId: null,
        targetConcept: 'Advancement',
        priority: 3,
        isDismissed: false,
      });
    }
  }

  // Check concept mastery signals
  const weakConcepts = mastery.filter((m) => m.masteryScore < 60);
  for (const wc of weakConcepts) {
    recsToInsert.push({
      tenantId,
      userId,
      courseId,
      recommendationType: 'REVIEW_LESSON',
      titleEn: `Practice Concept: ${wc.conceptKey}`,
      titleAr: `تمارين إضافية للمفهوم: ${wc.conceptKey}`,
      descriptionEn: `Mastery score is ${wc.masteryScore}%. Solve practice exercises or ask the AI Tutor for clarification on this topic.`,
      descriptionAr: `درجة الإتقان ${wc.masteryScore}%. يرجى حل التمارين أو سؤال المعلم الذكي للحصول على إيضاحات.`,
      lessonId: null,
      targetConcept: wc.conceptKey,
      priority: 2,
      isDismissed: false,
    });
  }

  // Save generated recommendations
  const resultRows: AcademyAdaptiveRecommendationRow[] = [];
  for (const r of recsToInsert) {
    const id = `acad_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const row: AcademyAdaptiveRecommendationRow = {
      ...r,
      id,
      createdAt: new Date(),
    };

    if (db) {
      try {
        await db.insert(academyAdaptiveRecommendationsTable).values(row as any);
      } catch (err) {
        logStructured('warn', 'ACADEMY_DB_GEN_REC_INSERT_FALLBACK', { error: String(err) });
      }
    }
    memoryAdaptiveRecommendations.push(row);
    resultRows.push(row);
  }

  return resultRows;
}

export async function getAdaptiveRecommendations(
  tenantId: string,
  userId: string,
  courseId: string
): Promise<AcademyAdaptiveRecommendationRow[]> {
  if (db) {
    try {
      const recs = await db
        .select()
        .from(academyAdaptiveRecommendationsTable)
        .where(
          and(
            eq(academyAdaptiveRecommendationsTable.tenantId, tenantId),
            eq(academyAdaptiveRecommendationsTable.userId, userId),
            eq(academyAdaptiveRecommendationsTable.courseId, courseId),
            eq(academyAdaptiveRecommendationsTable.isDismissed, false)
          )
        )
        .orderBy(asc(academyAdaptiveRecommendationsTable.priority));
      return recs;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_RECS_FALLBACK', { error: String(err) });
    }
  }

  const userCourseRecs = memoryAdaptiveRecommendations.filter(
    (r) => r.tenantId === tenantId && r.userId === userId && r.courseId === courseId
  );

  if (userCourseRecs.length > 0) {
    return userCourseRecs.filter((r) => !r.isDismissed);
  }

  // Auto-generate if none exist
  return generateAdaptiveRecommendations(tenantId, userId, courseId);
}

export async function dismissRecommendation(
  tenantId: string,
  userId: string,
  recommendationId: string
): Promise<boolean> {
  if (db) {
    try {
      await db
        .update(academyAdaptiveRecommendationsTable)
        .set({ isDismissed: true })
        .where(
          and(
            eq(academyAdaptiveRecommendationsTable.tenantId, tenantId),
            eq(academyAdaptiveRecommendationsTable.userId, userId),
            eq(academyAdaptiveRecommendationsTable.id, recommendationId)
          )
        );
      return true;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_DISMISS_REC_FALLBACK', { error: String(err) });
    }
  }

  const rec = memoryAdaptiveRecommendations.find(
    (r) => r.tenantId === tenantId && r.userId === userId && r.id === recommendationId
  );
  if (rec) {
    rec.isDismissed = true;
    return true;
  }
  return false;
}

// ── Phase 6 Practical Labs ──────────────────────────────────────────────────

export async function getOrCreateLabSession(params: {
  tenantId: string;
  userId: string;
  courseId: string;
  lessonId: string;
  labType: 'CODING_LAB' | 'STUDIO_LAB';
  initialCheckpoints?: string[];
}): Promise<AcademyLabSessionRow> {
  const { tenantId, userId, courseId, lessonId, labType, initialCheckpoints = [] } = params;

  if (db) {
    try {
      const existing = await db
        .select()
        .from(academyLabSessionsTable)
        .where(
          and(
            eq(academyLabSessionsTable.tenantId, tenantId),
            eq(academyLabSessionsTable.userId, userId),
            eq(academyLabSessionsTable.lessonId, lessonId)
          )
        );
      if (existing.length > 0) return existing[0];

      const newId = `acad_lab_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const defaultCheckpointsJson = JSON.stringify(
        initialCheckpoints.map((cp, idx) => ({ id: `cp_${idx + 1}`, label: cp, status: 'PENDING' }))
      );

      const [created] = await db
        .insert(academyLabSessionsTable)
        .values({
          id: newId,
          tenantId,
          userId,
          courseId,
          lessonId,
          labType,
          codeProjectId: labType === 'CODING_LAB' ? `code_proj_${lessonId}` : null,
          studioProjectId: labType === 'STUDIO_LAB' ? `studio_proj_${lessonId}` : null,
          status: 'IN_PROGRESS',
          checkpointsJson: defaultCheckpointsJson,
          score: 0,
        })
        .returning();
      return created;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_CREATE_LAB_SESSION_FALLBACK', { error: String(err) });
    }
  }

  const memExisting = memoryLabSessions.find(
    (s) => s.tenantId === tenantId && s.userId === userId && s.lessonId === lessonId
  );
  if (memExisting) return memExisting;

  const defaultCheckpointsJson = JSON.stringify(
    initialCheckpoints.map((cp, idx) => ({ id: `cp_${idx + 1}`, label: cp, status: 'PENDING' }))
  );

  const newSession: AcademyLabSessionRow = {
    id: `acad_lab_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    userId,
    courseId,
    lessonId,
    labType,
    codeProjectId: labType === 'CODING_LAB' ? `code_proj_${lessonId}` : null,
    studioProjectId: labType === 'STUDIO_LAB' ? `studio_proj_${lessonId}` : null,
    status: 'IN_PROGRESS',
    checkpointsJson: defaultCheckpointsJson,
    score: 0,
    feedback: null,
    startedAt: new Date(),
    completedAt: null,
    updatedAt: new Date(),
  };

  memoryLabSessions.push(newSession);
  return newSession;
}

export async function getLabSession(
  tenantId: string,
  userId: string,
  sessionId: string
): Promise<AcademyLabSessionRow | null> {
  if (db) {
    try {
      const res = await db
        .select()
        .from(academyLabSessionsTable)
        .where(
          and(
            eq(academyLabSessionsTable.tenantId, tenantId),
            eq(academyLabSessionsTable.userId, userId),
            eq(academyLabSessionsTable.id, sessionId)
          )
        );
      if (res.length > 0) return res[0];
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_GET_LAB_SESSION_FALLBACK', { error: String(err) });
    }
  }

  return (
    memoryLabSessions.find(
      (s) => s.tenantId === tenantId && s.userId === userId && s.id === sessionId
    ) || null
  );
}

export async function submitLabSession(params: {
  tenantId: string;
  userId: string;
  sessionId: string;
  checkpointsJson?: string;
  score?: number;
  feedback?: string;
}): Promise<AcademyLabSessionRow | null> {
  const { tenantId, userId, sessionId, checkpointsJson, score = 100, feedback } = params;

  if (db) {
    try {
      const [updated] = await db
        .update(academyLabSessionsTable)
        .set({
          status: 'COMPLETED',
          score,
          feedback: feedback || 'Lab checkpoints successfully verified.',
          checkpointsJson: checkpointsJson || undefined,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(academyLabSessionsTable.tenantId, tenantId),
            eq(academyLabSessionsTable.userId, userId),
            eq(academyLabSessionsTable.id, sessionId)
          )
        )
        .returning();
      if (updated) return updated;
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_SUBMIT_LAB_SESSION_FALLBACK', { error: String(err) });
    }
  }

  const session = memoryLabSessions.find(
    (s) => s.tenantId === tenantId && s.userId === userId && s.id === sessionId
  );
  if (session) {
    session.status = 'COMPLETED';
    session.score = score;
    session.feedback = feedback || 'Lab checkpoints successfully verified.';
    if (checkpointsJson) session.checkpointsJson = checkpointsJson;
    session.completedAt = new Date();
    session.updatedAt = new Date();
    return session;
  }
  return null;
}

export async function listLearnerLabSessions(
  tenantId: string,
  userId: string,
  courseId?: string
): Promise<AcademyLabSessionRow[]> {
  if (db) {
    try {
      const conditions = [
        eq(academyLabSessionsTable.tenantId, tenantId),
        eq(academyLabSessionsTable.userId, userId),
      ];
      if (courseId) {
        conditions.push(eq(academyLabSessionsTable.courseId, courseId));
      }
      return await db
        .select()
        .from(academyLabSessionsTable)
        .where(and(...conditions))
        .orderBy(desc(academyLabSessionsTable.updatedAt));
    } catch (err) {
      logStructured('warn', 'ACADEMY_DB_LIST_LAB_SESSIONS_FALLBACK', { error: String(err) });
    }
  }

  return memoryLabSessions
    .filter((s) => s.tenantId === tenantId && s.userId === userId && (!courseId || s.courseId === courseId))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
