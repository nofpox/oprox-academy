// ── Academy Admin Store: Instructor, Organization, Admin Operations ──

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
import { getInstructorProfile } from './catalogStore';

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

