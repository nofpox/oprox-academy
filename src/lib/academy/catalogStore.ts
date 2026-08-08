// ── Academy Catalog Store: Profiles, Categories, Courses, Modules, Lessons ──

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

import {
  memoryProfiles, memoryInstructors, memoryCategories, memoryPaths,
  memoryCourses, memoryModules, memoryLessons, memoryResources,
  memoryEnrollments, memoryLessonProgress, memoryCourseProgress,
  memorySessions, memoryBookmarks, memoryAssessments,
  memoryAssessmentQuestions, memoryAssessmentChoices,
  memoryAssessmentAttempts, memoryLearnerAnswers, memoryAssignments,
  memoryAssignmentSubmissions, memoryCertificates, memoryOrgPrograms,
  memoryOrgProgramCourses, memoryCohorts, memoryCohortMembers,
  memoryOrgAssignments, memoryInstructorCourses, memoryAdminLogs,
  memoryTutorSessions, memoryTutorMessages, memoryLearnerMastery,
  memoryAdaptiveRecommendations, memoryLabSessions,
} from './memoryState';


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

      const query = db
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

