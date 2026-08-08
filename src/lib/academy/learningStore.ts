// ── Academy Learning Store: Enrollment, Progress, Sessions, Bookmarks ──

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
import { getCourseBySlugOrId, listCourseModules, listModuleLessons } from './catalogStore';

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
