// ── Academy Adaptive Store: Mastery, Recommendations, Labs ──

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
import { listCourseModules, listModuleLessons } from './catalogStore';
import { getCourseProgress } from './learningStore';
import { getLearnerAssessmentAttempts } from './assessmentStore';

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
  const failedAttempts = courseAttempts.filter((a) => a.scorePercent !== null && a.scorePercent < 70);
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
    const courseProgress = courseProgressList;
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
