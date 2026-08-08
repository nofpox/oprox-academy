// ── Academy Tutor Store: AI Tutor Sessions and Messages ──

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
      const query = db
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

